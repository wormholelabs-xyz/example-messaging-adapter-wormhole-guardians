// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";

contract MockEndpoint {
    uint16 public immutable ourChain;

    // These are set on calls.
    uint16 public lastSourceChain;
    UniversalAddress public lastSourceAddress;
    uint64 public lastSequence;
    uint16 public lastDestinationChain;
    UniversalAddress public lastDestinationAddress;
    bytes32 public lastPayloadHash;

    constructor(uint16 _ourChain) {
        ourChain = _ourChain;
    }

    function attestMessage(
        uint16 srcChain,
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress destinationAddress,
        bytes32 payloadHash
    ) external {
        lastSourceChain = srcChain;
        lastSourceAddress = srcAddr;
        lastSequence = sequence;
        lastDestinationChain = dstChain;
        lastDestinationAddress = destinationAddress;
        lastPayloadHash = payloadHash;
    }
}
