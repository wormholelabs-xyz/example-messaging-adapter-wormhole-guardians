// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {WormholeTransceiver} from "../src/WormholeTransceiver.sol";
import "forge-std/Script.sol";
import "example-gmp-router/libraries/UniversalAddress.sol";

// ReceiveMsg is a forge script to receive a message on the WormholeTransceiver contract. Use ./sh/receiveMsg.sh to invoke this.
contract ReceiveMsg is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(address wormholeTransceiver, bytes calldata vaaBytes) public {
        _receiveMsg(wormholeTransceiver, vaaBytes);
    }

    function run(address wormholeTransceiver, bytes calldata vaaBytes) public {
        vm.startBroadcast();
        _receiveMsg(wormholeTransceiver, vaaBytes);
        vm.stopBroadcast();
    }

    function _receiveMsg(address wormholeTransceiver, bytes calldata vaaBytes) internal {
        WormholeTransceiver wormholeTransceiverContract = WormholeTransceiver(wormholeTransceiver);
        wormholeTransceiverContract.receiveMessage(vaaBytes);
    }
}
