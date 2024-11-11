// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {WormholeGuardiansAdapter} from "../src/WormholeGuardiansAdapter.sol";
import "forge-std/Script.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";

// SetPeer is a forge script to set the peer for a given chain with the WormholeGuardiansAdapter contract. Use ./sh/setPeer.sh to invoke this.
contract SetPeer is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(address wormholeGuardiansAdapter, uint16 peerChain, bytes32 peerAddress) public {
        _setPeer(wormholeGuardiansAdapter, peerChain, peerAddress);
    }

    function run(address wormholeGuardiansAdapter, uint16 peerChain, bytes32 peerAddress) public {
        vm.startBroadcast();
        _setPeer(wormholeGuardiansAdapter, peerChain, peerAddress);
        vm.stopBroadcast();
    }

    function _setPeer(address wormholeGuardiansAdapter, uint16 peerChain, bytes32 peerAddress) internal {
        WormholeGuardiansAdapter wormholeGuardiansAdapterContract = WormholeGuardiansAdapter(wormholeGuardiansAdapter);
        wormholeGuardiansAdapterContract.setPeer(peerChain, peerAddress);
    }
}
