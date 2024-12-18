// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "example-messaging-endpoint/evm/src/interfaces/IAdapter.sol";

interface IWormholeGuardiansAdapter is IAdapter {
    // =============== Types ================================================================

    /// @notice Defines each entry in the array returned by getPeers.
    struct PeerEntry {
        uint16 chain;
        bytes32 addr;
    }

    // =============== Events ================================================================

    /// @notice Emitted when the admin is changed for an integrator.
    /// @dev Topic0
    ///      0x101b8081ff3b56bbf45deb824d86a3b0fd38b7e3dd42421105cf8abe9106db0b
    /// @param oldAdmin The address of the old admin contract.
    /// @param newAdmin The address of the new admin contract.
    event AdminUpdated(address oldAdmin, address newAdmin);

    /// @notice Emitted when an admin change request is received for an integrator.
    /// @dev Topic0
    ///      0x51976906b2cd2da8d93d96f315416f8f479f1bd9f7b6c963ad81733c123587e2
    /// @param oldAdmin The address of the old admin contract.
    /// @param newAdmin The address of the new admin contract.
    event AdminUpdateRequested(address oldAdmin, address newAdmin);

    /// @notice Emitted when the admin is discarded (set to zero).
    /// @dev Topic0
    ///      0xf59e4ee73808efe6c573443d5085333da02eaad3e9890ee65f92053f08b84f4b
    /// @param oldAdmin The address of the old admin contract.
    event AdminDiscarded(address oldAdmin);

    /// @notice Emitted when a peer adapter is set.
    /// @dev Topic0
    ///      0xb54661e84edd2fae127113fec00db0f3a82af37b0347eefb108eba05122224e7
    /// @param chain The Wormhole chain ID of the peer.
    /// @param peerContract The address of the peer contract.
    event PeerAdded(uint16 chain, bytes32 peerContract);

    /// @notice Emitted when a message is sent from the adapter.
    /// @dev Topic0
    ///      0x538adc4f44128ecd04c5b39098e01f60938ab03d019a24fde085a6d2e643864f
    /// @param srcAddr The universal address of the sender.
    /// @param dstChain The Wormhole chain ID of the recipient.
    /// @param dstAddr The universal address of the recipient.
    /// @param sequence The per-integrator sequence number associated with the message.
    /// @param payloadHash The hash of the message to be sent to the recipient chain..
    event MessageSent(
        UniversalAddress srcAddr, uint16 dstChain, UniversalAddress dstAddr, uint64 sequence, bytes32 payloadHash
    );

    /// @notice Emitted when a message is received.
    /// @dev Topic0
    ///     0x5ca30e27fb77c6ca1ed58126d3c96e979a7a3ac370738f72ea998af0dcff2e04
    /// @param digest The digest of the message.
    /// @param emitterChain The Wormhole chain ID of the emitter.
    /// @param emitterAddress The address of the emitter.
    /// @param sequence The sequence of the message.
    event MessageReceived(bytes32 digest, uint16 emitterChain, bytes32 emitterAddress, uint64 sequence);

    // =============== Errors ================================================================

    /// @notice Error when the caller is not the registered admin.
    /// @dev Selector: 0xe3fb72e9
    /// @param caller The address of the caller.
    error CallerNotAdmin(address caller);

    /// @notice Error when an admin action is attempted while an admin transfer is pending.
    /// @dev Selector: 9e78953d
    error AdminTransferPending();

    /// @notice Error when an attempt to claim the admin is made when there is no transfer pending.
    /// @dev Selector: 0x1ee0a99f
    error NoAdminUpdatePending();

    /// @notice Error when the admin is the zero address.
    /// @dev Selector: 0x554ff5d7
    error InvalidAdminZeroAddress();

    /// @notice Error if the VAA is invalid.
    /// @dev Selector: 0x8ee2e336
    /// @param reason The reason the VAA is invalid.
    error InvalidVaa(string reason);

    /// @notice Error if the peer has already been set.
    /// @dev Selector: 0xb55eeae9
    /// @param chain The Wormhole chain ID of the peer.
    /// @param peerAddress The address of the peer.
    error PeerAlreadySet(uint16 chain, bytes32 peerAddress);

    /// @notice Error the peer contract cannot be the zero address.
    /// @dev Selector: 0xf839a0cb
    error InvalidPeerZeroAddress();

    /// @notice Error when the chain ID doesn't match this chain.
    /// @dev Selector: 0x587c94c3
    /// @param chain The Wormhole chain ID of the peer.
    error InvalidChain(uint16 chain);

    /// @notice Error when the peer adapter is invalid.
    /// @dev Selector: 0xaf1181fa
    /// @param chain The Wormhole chain ID of the peer.
    /// @param peerAddress The address of the invalid peer.
    error InvalidPeer(uint16 chain, bytes32 peerAddress);

    /// @notice Length of adapter payload is wrong.
    /// @dev Selector: 0xc37906a0
    /// @param received Number of payload bytes received.
    /// @param expected Number of payload bytes expected.
    error InvalidPayloadLength(uint256 received, uint256 expected);

    // =============== Functions ================================================================

    /// @notice Transfers admin privileges from the current admin to another contract.
    /// @dev The msg.sender must be the current admin contract.
    /// @param newAdmin The address of the new admin.
    function updateAdmin(address newAdmin) external;

    /// @notice Starts the two step process of transferring admin privileges from the current admin to another contract.
    /// @dev The msg.sender must be the current admin contract.
    /// @param newAdmin The address of the new admin.
    function transferAdmin(address newAdmin) external;

    /// @notice Completes the two step process of transferring admin privileges from the current admin to another contract.
    /// @dev The msg.sender must be the pending admin or the current admin contract (which cancels the transfer).
    function claimAdmin() external;

    /// @notice Sets the admin contract to null, making the configuration immutable. THIS IS NOT REVERSIBLE.
    /// @dev The msg.sender must be the current admin contract.
    function discardAdmin() external;

    /// @notice Get the peer Adapter contract on the specified chain.
    /// @param chain The Wormhole chain ID of the peer to get.
    /// @return peerContract The address of the peer contract on the given chain.
    function getPeer(uint16 chain) external view returns (bytes32);

    /// @notice Returns an array of all the peers to which this adapter is connected.
    /// @return results An array of all of the connected peers including the chain id and contract address of each.
    function getPeers() external view returns (PeerEntry[] memory results);

    /// @notice Set the Wormhole peer contract for the given chain.
    /// @dev This function is only callable by the `owner`.
    ///      Once the peer is set for a chain it may not be changed.
    /// @param chain The Wormhole chain ID of the peer to set.
    /// @param peerContract The address of the peer contract on the given chain.
    function setPeer(uint16 chain, bytes32 peerContract) external;

    /// @notice Receive an attested message from the verification layer.
    ///         This function should verify the `encodedVm` and then deliver the attestation
    /// to the adapter NttManager contract.
    /// @param encodedMessage The attested message.
    function receiveMessage(bytes calldata encodedMessage) external;
}
