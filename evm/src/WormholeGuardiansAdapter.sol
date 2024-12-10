// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "example-messaging-endpoint/evm/src/interfaces/IEndpointAdapter.sol";
import "wormhole-solidity-sdk/libraries/BytesParsing.sol";
import "wormhole-solidity-sdk/interfaces/IWormhole.sol";

import "./interfaces/IWormholeGuardiansAdapter.sol";

string constant wormholeGuardiansAdapterVersionString = "WormholeGuardiansAdapter-0.0.1";

contract WormholeGuardiansAdapter is IWormholeGuardiansAdapter {
    using BytesParsing for bytes; // Used by _decodePayload

    // ==================== Immutables ===============================================

    address public admin;
    address public pendingAdmin;
    uint16 public immutable ourChain;
    IEndpointAdapter public immutable endpoint;
    IWormhole public immutable wormhole;
    uint8 public immutable consistencyLevel;

    // ==================== Constructor ==============================================

    constructor(uint16 _ourChain, address _admin, address _endpoint, address _wormhole, uint8 _consistencyLevel) {
        assert(_ourChain != 0);
        assert(_admin != address(0));
        assert(_endpoint != address(0));
        assert(_wormhole != address(0));
        // Not checking consistency level since maybe zero is valid?
        ourChain = _ourChain;
        admin = _admin;
        endpoint = IEndpointAdapter(_endpoint);
        wormhole = IWormhole(_wormhole);
        consistencyLevel = _consistencyLevel;
    }

    // =============== Storage Keys =============================================

    bytes32 private constant WORMHOLE_PEERS_SLOT = bytes32(uint256(keccak256("whAdapter.peers")) - 1);
    bytes32 private constant CHAINS_SLOT = bytes32(uint256(keccak256("whAdapter.chains")) - 1);

    // =============== Storage Accessors ========================================

    function _getPeersStorage() internal pure returns (mapping(uint16 => bytes32) storage $) {
        uint256 slot = uint256(WORMHOLE_PEERS_SLOT);
        assembly ("memory-safe") {
            $.slot := slot
        }
    }

    function _getChainsStorage() internal pure returns (uint16[] storage $) {
        uint256 slot = uint256(CHAINS_SLOT);
        assembly ("memory-safe") {
            $.slot := slot
        }
    }

    // =============== Public Getters ======================================================

    /// @inheritdoc IWormholeGuardiansAdapter
    function getPeer(uint16 chainId) public view returns (bytes32) {
        return _getPeersStorage()[chainId];
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function getPeers() public view returns (PeerEntry[] memory results) {
        uint16[] storage chains = _getChainsStorage();
        uint256 len = chains.length;
        results = new PeerEntry[](len);
        for (uint256 idx = 0; idx < len;) {
            results[idx].chain = chains[idx];
            results[idx].addr = getPeer(chains[idx]);
            unchecked {
                ++idx;
            }
        }
    }

    // =============== Admin ===============================================================

    /// @inheritdoc IWormholeGuardiansAdapter
    function updateAdmin(address newAdmin) external onlyAdmin {
        // SPEC: MUST check that the caller is the current admin and there is not a pending transfer.
        // - This is handled by onlyAdmin.

        // SPEC: If possible, MUST NOT allow the admin to discard admin via this command (e.g. newAdmin != address(0) on EVM)
        if (newAdmin == address(0)) {
            revert InvalidAdminZeroAddress();
        }

        // SPEC: Immediately sets newAdmin as the admin of the integrator.
        admin = newAdmin;
        emit AdminUpdated(msg.sender, newAdmin);
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function transferAdmin(address newAdmin) external onlyAdmin {
        // SPEC: MUST check that the caller is the current admin and there is not a pending transfer.
        // - This is handled by onlyAdmin.

        // SPEC: If possible, MUST NOT allow the admin to discard admin via this command (e.g. `newAdmin != address(0)` on EVM).
        if (newAdmin == address(0)) {
            revert InvalidAdminZeroAddress();
        }

        // SPEC: Initiates the first step of a two-step process in which the current admin (to cancel) or new admin must claim.
        pendingAdmin = newAdmin;
        emit AdminUpdateRequested(msg.sender, newAdmin);
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function claimAdmin() external {
        // This doesn't use onlyAdmin because the pending admin must be non-zero.

        // SPEC: MUST check that the caller is the current admin OR the pending admin.
        if ((admin != msg.sender) && (pendingAdmin != msg.sender)) {
            revert CallerNotAdmin(msg.sender);
        }

        // SPEC: MUST check that there is an admin transfer pending (e. g. pendingAdmin != address(0) on EVM).
        if (pendingAdmin == address(0)) {
            revert NoAdminUpdatePending();
        }

        // SPEC: Cancels / Completes the second step of the two-step transfer. Sets the admin to the caller and clears the pending admin.
        address oldAdmin = admin;
        admin = msg.sender;
        pendingAdmin = address(0);
        emit AdminUpdated(oldAdmin, msg.sender);
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function discardAdmin() external onlyAdmin {
        // SPEC: MUST check that the caller is the current admin and there is not a pending transfer.
        // - This is handled by onlyAdmin.

        // SPEC: Clears the current admin. THIS IS NOT REVERSIBLE. This ensures that the Integrator configuration becomes immutable.
        admin = address(0);
        emit AdminDiscarded(msg.sender);
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function setPeer(uint16 peerChain, bytes32 peerContract) external onlyAdmin {
        if (peerChain == 0) {
            revert InvalidChain(peerChain);
        }
        if (peerContract == bytes32(0)) {
            revert InvalidPeerZeroAddress();
        }

        bytes32 oldPeerContract = _getPeersStorage()[peerChain];

        // SPEC: MUST not set the peer if it is already set.
        if (oldPeerContract != bytes32(0)) {
            revert PeerAlreadySet(peerChain, oldPeerContract);
        }

        _getPeersStorage()[peerChain] = peerContract;
        _getChainsStorage().push(peerChain);
        emit PeerAdded(peerChain, peerContract);
    }

    // =============== Interface ===============================================================

    /// @inheritdoc IAdapter
    function getAdapterType() external pure virtual returns (string memory) {
        return wormholeGuardiansAdapterVersionString;
    }

    /// @inheritdoc IAdapter
    function quoteDeliveryPrice(uint16, /*dstChain*/ bytes calldata /*instructions*/ )
        external
        view
        virtual
        returns (uint256)
    {
        return wormhole.messageFee();
    }

    /// @inheritdoc IAdapter
    /// @dev The caller should set the delivery price in msg.value.
    function sendMessage(
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress dstAddr,
        bytes32 payloadHash,
        address, // refundAddr
        bytes calldata // instructions
    ) external payable virtual onlyEndpoint {
        bytes memory payload = _encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
        wormhole.publishMessage{value: msg.value}(0, payload, consistencyLevel);
        emit MessageSent(srcAddr, dstChain, dstAddr, sequence, payloadHash);
    }

    /// @inheritdoc IWormholeGuardiansAdapter
    function receiveMessage(bytes calldata encodedMessage) external {
        // Verify the wormhole message and extract the source chain and payload.
        (uint16 srcChain, bytes memory payload) = _verifyMessage(encodedMessage);

        // Decode our payload.
        (UniversalAddress srcAddr, uint64 sequence, uint16 dstChain, UniversalAddress dstAddr, bytes32 payloadHash) =
            _decodePayload(payload);

        // Not validating that the dest chain is our chain because the endpoint does that.

        // Post the message to the endpoint.
        endpoint.attestMessage(srcChain, srcAddr, sequence, dstChain, dstAddr, payloadHash);

        // We don't need to emit an event here because _verifyMessage already did.
    }

    // ============= Internal ===============================================================

    function _encodePayload(
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress dstAddr,
        bytes32 payloadHash
    ) internal pure returns (bytes memory payload) {
        return abi.encodePacked(srcAddr, sequence, dstChain, dstAddr, payloadHash);
    }

    function _decodePayload(bytes memory payload)
        internal
        pure
        returns (
            UniversalAddress srcAddr,
            uint64 sequence,
            uint16 dstChain,
            UniversalAddress dstAddr,
            bytes32 payloadHash
        )
    {
        bytes32 b32;
        uint256 offset = 0;

        (b32, offset) = payload.asBytes32(offset);
        srcAddr = UniversalAddressLibrary.fromBytes32(b32);

        (sequence, offset) = payload.asUint64(offset);
        (dstChain, offset) = payload.asUint16(offset);

        (b32, offset) = payload.asBytes32(offset);
        dstAddr = UniversalAddressLibrary.fromBytes32(b32);

        (payloadHash, offset) = payload.asBytes32(offset);

        _checkLength(payload, offset);
    }

    function _verifyMessage(bytes memory encodedMessage) internal returns (uint16, bytes memory) {
        // Verify VAA against Wormhole Core Bridge contract.
        (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(encodedMessage);
        if (!valid) {
            revert InvalidVaa(reason);
        }

        // Ensure that the message came from the registered peer contract.
        if (getPeer(vm.emitterChainId) != vm.emitterAddress) {
            revert InvalidPeer(vm.emitterChainId, vm.emitterAddress);
        }

        emit MessageReceived(vm.hash, vm.emitterChainId, vm.emitterAddress, vm.sequence);
        return (vm.emitterChainId, vm.payload);
    }

    function _checkLength(bytes memory payload, uint256 expected) private pure {
        if (payload.length != expected) {
            revert InvalidPayloadLength(payload.length, expected);
        }
    }

    // =============== MODIFIERS ===============================================

    modifier onlyAdmin() {
        if (admin != msg.sender) {
            revert CallerNotAdmin(msg.sender);
        }
        if (pendingAdmin != address(0)) {
            revert AdminTransferPending();
        }
        _;
    }

    modifier onlyEndpoint() {
        if (address(endpoint) != msg.sender) {
            revert CallerNotEndpoint(msg.sender);
        }
        _;
    }
}
