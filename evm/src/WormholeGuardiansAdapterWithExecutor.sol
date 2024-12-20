// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "wormhole-solidity-sdk/libraries/BytesParsing.sol";
import "example-messaging-executor/evm/src/interfaces/IExecutor.sol";
import "example-messaging-executor/evm/src/libraries/ExecutorMessages.sol";

import "./WormholeGuardiansAdapter.sol";

string constant wormholeGuardiansAdapterWithExecutorVersionString = "WormholeGuardiansAdapterWithExecutor-0.0.1";

contract WormholeGuardiansAdapterWithExecutor is WormholeGuardiansAdapter {
    using BytesParsing for bytes; // Used to parse the instructions

    // ==================== Immutables ===============================================

    bytes32 public emitterAddress;

    // Version number of the encoded adapter instructions.
    uint8 private constant INST_VERSION = 1;

    /// @notice Length of adapter instructions is wrong.
    /// @dev Selector: 0x345dac0f
    /// @param received Number of instruction bytes received.
    /// @param expected Number of instruction bytes expected.
    error InvalidInstructionsLength(uint256 received, uint256 expected);

    /// @notice Length of signed quote won't fit in a uint16.
    /// @dev Selector: 0x05c610c6
    error SignedQuoteTooLong();

    /// @notice Length of relay instructions won't fit in a uint16.
    /// @dev Selector: 0xff4aadf4
    error RelayInstructionsTooLong();

    // ==================== Immutables ===============================================

    IExecutor public immutable executor;

    // ==================== Constructor ==============================================

    constructor(
        uint16 _ourChain,
        address _admin,
        address _endpoint,
        address _executor,
        address _wormhole,
        uint8 _consistencyLevel
    ) WormholeGuardiansAdapter(_ourChain, _admin, _endpoint, _wormhole, _consistencyLevel) {
        assert(_executor != address(0));
        executor = IExecutor(_executor);
        emitterAddress = UniversalAddressLibrary.fromAddress(address(this)).toBytes32();
    }

    /// @inheritdoc IAdapter
    function getAdapterType() external pure override returns (string memory) {
        return wormholeGuardiansAdapterWithExecutorVersionString;
    }

    /// @inheritdoc IAdapter
    /// @dev The caller should set the delivery price in msg.value.
    function sendMessage(
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress dstAddr,
        bytes32 payloadHash,
        address refundAddr,
        bytes calldata instructions
    ) external payable override onlyEndpoint {
        (uint256 execMsgValue, bytes memory signedQuote, bytes memory relayInstructions) =
            _parseInstructions(instructions);

        bytes memory payload = _encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
        uint64 coreSeq = wormhole.publishMessage{value: msg.value - execMsgValue}(0, payload, consistencyLevel);
        emit MessageSent(srcAddr, dstChain, dstAddr, sequence, payloadHash);

        executor.requestExecution{value: execMsgValue}(
            dstChain,
            getPeer(dstChain),
            refundAddr,
            signedQuote,
            ExecutorMessages.makeVAAV1Request(ourChain, emitterAddress, coreSeq),
            relayInstructions
        );
    }

    /// @inheritdoc IAdapter
    function quoteDeliveryPrice(uint16, /*dstChain*/ bytes calldata instructions)
        external
        view
        override
        returns (uint256)
    {
        uint256 execMsgValue = _parseExecMsgValueOnly(instructions);
        return wormhole.messageFee() + execMsgValue;
    }

    function _parseInstructions(bytes calldata buf)
        internal
        pure
        returns (uint256 execMsgValue, bytes memory signedQuote, bytes memory relayInst)
    {
        uint256 offset = 0;
        uint16 len = 0;

        // For now we can just ignore the version, but maybe not someday. . .
        uint8 version;
        (version, offset) = buf.asUint8(offset);

        // First 32 bytes is execMsgValue.
        (execMsgValue, offset) = buf.asUint256(offset);

        // Two byte length of signed quote.
        (len, offset) = buf.asUint16(offset);
        (signedQuote, offset) = buf.sliceUnchecked(offset, len);

        // Two byte length of relay instructions.
        (len, offset) = buf.asUint16(offset);
        (relayInst, offset) = buf.sliceUnchecked(offset, len);

        _checkInstructionsLength(buf, offset);
    }

    function _parseExecMsgValueOnly(bytes calldata buf) internal pure returns (uint256 execMsgValue) {
        // First 32 bytes is execMsgValue.
        uint256 offset = 0;

        // For now we can just ignore the version, but maybe not someday. . .
        uint8 version;
        (version, offset) = buf.asUint8(offset);

        (execMsgValue, offset) = buf.asUint256(offset);
        // We don't check for extra bytes here because there are remaining fields we didn't parse.
    }

    function _checkInstructionsLength(bytes calldata buf, uint256 expected) private pure {
        if (buf.length != expected) {
            revert InvalidInstructionsLength(buf.length, expected);
        }
    }

    function encodeInstructions(uint256 execMsgValue, bytes calldata signedQuote, bytes calldata relayInstructions)
        external
        pure
        returns (bytes memory encoded)
    {
        if (signedQuote.length > type(uint16).max) {
            revert SignedQuoteTooLong();
        }

        if (relayInstructions.length > type(uint16).max) {
            revert RelayInstructionsTooLong();
        }

        return abi.encodePacked(
            INST_VERSION,
            execMsgValue,
            uint16(signedQuote.length),
            signedQuote,
            uint16(relayInstructions.length),
            relayInstructions
        );
    }
}
