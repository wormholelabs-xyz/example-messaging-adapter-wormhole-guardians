// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {
    WormholeGuardiansAdapterWithExecutor,
    wormholeGuardiansAdapterWithExecutorVersionString
} from "../src/WormholeGuardiansAdapterWithExecutor.sol";
import "forge-std/Script.sol";

// DeployWormholeGuardiansAdapterWithExecutor is a forge script to deploy the WormholeGuardiansAdapterWithExecutor contract. Use ./sh/deployWormholeGuardiansAdapterWithExecutor.sh to invoke this.
contract DeployWormholeGuardiansAdapterWithExecutor is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(
        uint16 ourChain,
        address admin,
        address endpoint,
        address executor,
        address wormhole,
        uint8 consistencyLevel
    ) public {
        _deploy(ourChain, admin, endpoint, executor, wormhole, consistencyLevel);
    }

    function run(
        uint16 ourChain,
        address admin,
        address endpoint,
        address executor,
        address wormhole,
        uint8 consistencyLevel
    ) public returns (address deployedAddress) {
        vm.startBroadcast();
        (deployedAddress) = _deploy(ourChain, admin, endpoint, executor, wormhole, consistencyLevel);
        vm.stopBroadcast();
    }

    function _deploy(
        uint16 ourChain,
        address admin,
        address endpoint,
        address executor,
        address wormhole,
        uint8 consistencyLevel
    ) internal returns (address deployedAddress) {
        bytes32 salt = keccak256(abi.encodePacked(wormholeGuardiansAdapterWithExecutorVersionString));
        WormholeGuardiansAdapterWithExecutor wormholeGuardiansAdapterWithExecutor = new WormholeGuardiansAdapterWithExecutor{
            salt: salt
        }(ourChain, admin, endpoint, executor, wormhole, consistencyLevel);

        return (address(wormholeGuardiansAdapterWithExecutor));
    }
}
