// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";

contract MockExecutor {
    uint16 public immutable ourChain;

    // These are set on calls.
    uint16 public lastDstChain;
    bytes32 public lastDstAddr;
    address public lastRefundAddr;
    bytes public lastSignedQuote;
    bytes public lastRequestBytes;
    bytes public lastRelayInstructions;

    constructor(uint16 _ourChain) {
        ourChain = _ourChain;
    }

    function requestExecution(
        uint16 dstChain,
        bytes32 dstAddr,
        address refundAddr,
        bytes calldata signedQuote,
        bytes calldata requestBytes,
        bytes calldata relayInstructions
    ) external {
        lastDstChain = dstChain;
        lastDstAddr = dstAddr;
        lastRefundAddr = refundAddr;
        lastSignedQuote = signedQuote;
        lastRequestBytes = requestBytes;
        lastRelayInstructions = relayInstructions;
    }
}
