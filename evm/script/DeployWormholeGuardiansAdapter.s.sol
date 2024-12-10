// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {WormholeGuardiansAdapter, wormholeGuardiansAdapterVersionString} from "../src/WormholeGuardiansAdapter.sol";
import "forge-std/Script.sol";

// DeployWormholeGuardiansAdapter is a forge script to deploy the WormholeGuardiansAdapter contract. Use ./sh/deployWormholeGuardiansAdapter.sh to invoke this.
contract DeployWormholeGuardiansAdapter is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(uint16 ourChain, address admin, address endpoint, address wormhole, uint8 consistencyLevel)
        public
    {
        _deploy(ourChain, admin, endpoint, wormhole, consistencyLevel);
    }

    function run(uint16 ourChain, address admin, address endpoint, address wormhole, uint8 consistencyLevel)
        public
        returns (address deployedAddress)
    {
        vm.startBroadcast();
        (deployedAddress) = _deploy(ourChain, admin, endpoint, wormhole, consistencyLevel);
        vm.stopBroadcast();
    }

    function _deploy(uint16 ourChain, address admin, address endpoint, address wormhole, uint8 consistencyLevel)
        internal
        returns (address deployedAddress)
    {
        bytes32 salt = keccak256(abi.encodePacked(wormholeGuardiansAdapterVersionString));
        WormholeGuardiansAdapter wormholeGuardiansAdapter =
            new WormholeGuardiansAdapter{salt: salt}(ourChain, admin, endpoint, wormhole, consistencyLevel);

        return (address(wormholeGuardiansAdapter));
    }
}
