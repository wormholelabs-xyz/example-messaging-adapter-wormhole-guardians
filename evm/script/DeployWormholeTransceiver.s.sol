// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {WormholeTransceiver, wormholeTransceiverVersionString} from "../src/WormholeTransceiver.sol";
import "forge-std/Script.sol";

// DeployWormholeTransceiver is a forge script to deploy the WormholeTransceiver contract. Use ./sh/deployWormholeTransceiver.sh to invoke this.
contract DeployWormholeTransceiver is Script {
    function test() public {} // Exclude this from coverage report.

    function dryRun(
        uint16 ourChain,
        uint256 evmChain,
        address admin,
        address router,
        address wormhole,
        uint8 consistencyLevel
    ) public {
        _deploy(ourChain, evmChain, admin, router, wormhole, consistencyLevel);
    }

    function run(
        uint16 ourChain,
        uint256 evmChain,
        address admin,
        address router,
        address wormhole,
        uint8 consistencyLevel
    ) public returns (address deployedAddress) {
        vm.startBroadcast();
        (deployedAddress) = _deploy(ourChain, evmChain, admin, router, wormhole, consistencyLevel);
        vm.stopBroadcast();
    }

    function _deploy(
        uint16 ourChain,
        uint256 evmChain,
        address admin,
        address router,
        address wormhole,
        uint8 consistencyLevel
    ) internal returns (address deployedAddress) {
        bytes32 salt = keccak256(abi.encodePacked(wormholeTransceiverVersionString));
        WormholeTransceiver wormholeTransceiver =
            new WormholeTransceiver{salt: salt}(ourChain, evmChain, admin, router, wormhole, consistencyLevel);

        return (address(wormholeTransceiver));
    }
}
