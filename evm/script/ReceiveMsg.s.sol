// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {WormholeGuardiansAdapter} from "../src/WormholeGuardiansAdapter.sol";
import "forge-std/Script.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";

// ReceiveMsg is a forge script to receive a message on the WormholeGuardiansAdapter contract. Use ./sh/receiveMsg.sh to invoke this.
contract ReceiveMsg is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(address wormholeGuardiansAdapter, bytes calldata vaaBytes) public {
        _receiveMsg(wormholeGuardiansAdapter, vaaBytes);
    }

    function run(address wormholeGuardiansAdapter, bytes calldata vaaBytes) public {
        vm.startBroadcast();
        _receiveMsg(wormholeGuardiansAdapter, vaaBytes);
        vm.stopBroadcast();
    }

    function _receiveMsg(address wormholeGuardiansAdapter, bytes calldata vaaBytes) internal {
        WormholeGuardiansAdapter wormholeGuardiansAdapterContract = WormholeGuardiansAdapter(wormholeGuardiansAdapter);
        wormholeGuardiansAdapterContract.receiveMessage(vaaBytes);
    }
}
