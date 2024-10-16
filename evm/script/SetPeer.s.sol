// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import {WormholeTransceiver} from "../src/WormholeTransceiver.sol";
import "forge-std/Script.sol";
import "example-gmp-router/libraries/UniversalAddress.sol";

// SetPeer is a forge script to set the peer for a given chain with the WormholeTransceiver contract. Use ./sh/setPeer.sh to invoke this.
contract SetPeer is Script {
    function dryRun(address wormholeTransceiver, uint16 peerChain, bytes32 peerAddress) public {
        _setPeer(wormholeTransceiver, peerChain, peerAddress);
    }

    function run(address wormholeTransceiver, uint16 peerChain, bytes32 peerAddress) public {
        vm.startBroadcast();
        _setPeer(wormholeTransceiver, peerChain, peerAddress);
        vm.stopBroadcast();
    }

    function _setPeer(address wormholeTransceiver, uint16 peerChain, bytes32 peerAddress) internal {
        WormholeTransceiver wormholeTransceiverContract = WormholeTransceiver(wormholeTransceiver);
        wormholeTransceiverContract.setPeer(peerChain, peerAddress);
    }
}
