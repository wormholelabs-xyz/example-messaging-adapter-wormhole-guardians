// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.19;

import "example-messaging-executor/evm/src/interfaces/IExecutor.sol";

import "./WormholeGuardiansAdapter.sol";

string constant wormholeGuardiansAdapterWithExecutorVersionString = "WormholeGuardiansAdapterWithExecutor-0.0.1";

contract WormholeGuardiansAdapterWithExecutor is WormholeGuardiansAdapter {
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
        address refundAddr
    ) external payable override onlyEndpoint {
        bytes memory payload = _encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
        wormhole.publishMessage{value: msg.value}(0, payload, consistencyLevel);
        emit MessageSent(srcAddr, dstChain, dstAddr, sequence, payloadHash);

        // TODO: These should be passed in.
        bytes memory signedQuote = new bytes(0);
        bytes memory relayInstructions = new bytes(0);

        executor.requestExecution(dstChain, dstAddr.toBytes32(), refundAddr, signedQuote, payload, relayInstructions);
    }
}
