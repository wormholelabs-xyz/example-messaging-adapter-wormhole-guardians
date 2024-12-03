// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "wormhole-solidity-sdk/interfaces/IWormhole.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";
import "../src/WormholeGuardiansAdapterWithExecutor.sol";
import "../src/interfaces/IWormholeGuardiansAdapter.sol";
import "./mocks/MockEndpoint.sol";
import "./mocks/MockExecutor.sol";
import "./mocks/MockWormhole.sol";

contract WormholeGuardiansAdapterWithExecutorForTest is WormholeGuardiansAdapterWithExecutor {
    constructor(
        uint16 _ourChain,
        address _admin,
        address _endpoint,
        address _executor,
        address _wormhole,
        uint8 _consistencyLevel
    ) WormholeGuardiansAdapterWithExecutor(_ourChain, _admin, _endpoint, _executor, _wormhole, _consistencyLevel) {}

    function encodePayload(
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress dstAddr,
        bytes32 payloadHash
    ) external pure returns (bytes memory payload) {
        return _encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
    }
}

contract WormholeGuardiansAdapterWithExecutorTest is Test {
    address admin = address(0xabcdef);
    MockEndpoint srcEndpoint;
    MockEndpoint destEndpoint;
    MockExecutor srcExecutor;
    MockExecutor destExecutor;
    address endpointAddr;
    address executorAddr;
    address integratorAddr = address(0xabcded);
    address userA = address(0xabcdec);
    address someoneElse = address(0xabcdeb);
    MockWormhole srcWormhole;
    WormholeGuardiansAdapterWithExecutorForTest public srcAdapter;
    MockWormhole destWormhole;
    WormholeGuardiansAdapterWithExecutorForTest public destAdapter;
    uint8 consistencyLevel = 200;

    uint16 ourChain = 42;

    uint16 srcChain = 42;
    uint16 destChain = 43;

    uint16 peerChain1 = 1;
    address peerAddress1 = address(0x123456);

    uint16 peerChain2 = 2;
    address peerAddress2 = address(0x123456);

    uint16 peerChain3 = 3;

    function setUp() public {
        srcEndpoint = new MockEndpoint(srcChain);
        endpointAddr = address(srcEndpoint);
        destEndpoint = new MockEndpoint(destChain);

        srcExecutor = new MockExecutor(srcChain);
        executorAddr = address(srcExecutor);
        destExecutor = new MockExecutor(destChain);

        srcWormhole = new MockWormhole(srcChain);
        destWormhole = new MockWormhole(destChain);

        srcAdapter = new WormholeGuardiansAdapterWithExecutorForTest(
            srcChain, admin, endpointAddr, executorAddr, address(srcWormhole), consistencyLevel
        );

        destAdapter = new WormholeGuardiansAdapterWithExecutorForTest(
            destChain, admin, address(destEndpoint), address(destExecutor), address(destWormhole), consistencyLevel
        );

        // Give everyone some money to play with.
        vm.deal(integratorAddr, 1 ether);
        vm.deal(endpointAddr, 1 ether);
        vm.deal(userA, 1 ether);
        vm.deal(someoneElse, 1 ether);
    }

    function test_init() public view {
        require(srcAdapter.ourChain() == ourChain, "ourChain is not right");
        require(srcAdapter.admin() == admin, "admin is not right");
        require(address(srcAdapter.endpoint()) == endpointAddr, "endpoint is not right");
        require(address(srcAdapter.executor()) == executorAddr, "executor is not right");
        require(address(srcAdapter.wormhole()) == address(srcWormhole), "srcWormhole is not right");
        require(srcAdapter.consistencyLevel() == consistencyLevel, "consistencyLevel is not right");
    }

    function test_invalidInit() public {
        // ourChain can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapterWithExecutor(
            0, admin, address(destEndpoint), address(destExecutor), address(destWormhole), consistencyLevel
        );

        // admin can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapterWithExecutor(
            destChain, address(0), address(destEndpoint), address(destExecutor), address(destWormhole), consistencyLevel
        );

        // endpoint can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapterWithExecutor(
            destChain, admin, address(0), address(destExecutor), address(destWormhole), consistencyLevel
        );

        // executor can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapterWithExecutor(
            destChain, admin, address(destEndpoint), address(0), address(destWormhole), consistencyLevel
        );

        // wormhole can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapterWithExecutor(
            destChain, admin, address(destEndpoint), address(destExecutor), address(0), consistencyLevel
        );
    }

    function test_getAdapterType() public view {
        require(
            keccak256(abi.encodePacked(srcAdapter.getAdapterType()))
                == keccak256(abi.encodePacked(wormholeGuardiansAdapterWithExecutorVersionString)),
            "adapter type mismatch"
        );
    }

    // TODO: This should do something different!
    function test_sendMessage() public {
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = peerChain1;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        address refundAddr = userA;
        uint256 deliverPrice = 382;

        vm.startPrank(endpointAddr);
        srcAdapter.sendMessage{value: deliverPrice}(srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr);

        require(srcWormhole.messagesSent() == 1, "Message count is wrong");
        require(srcWormhole.lastNonce() == 0, "Nonce is wrong");
        require(srcWormhole.lastConsistencyLevel() == consistencyLevel, "Consistency level is wrong");
        require(srcWormhole.lastDeliveryPrice() == deliverPrice, "Deliver price is wrong");

        bytes memory expectedPayload = srcAdapter.encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
        require(
            keccak256(abi.encodePacked(srcWormhole.lastPayload())) == keccak256(expectedPayload), "Payload is wrong"
        );

        // Only the endpoint can call send message.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(IAdapter.CallerNotEndpoint.selector, someoneElse));
        srcAdapter.sendMessage{value: deliverPrice}(srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr);
    }
}
