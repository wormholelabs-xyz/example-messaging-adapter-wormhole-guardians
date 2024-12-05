// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "wormhole-solidity-sdk/interfaces/IWormhole.sol";
import "example-messaging-endpoint/evm/src/libraries/UniversalAddress.sol";
import "../src/WormholeGuardiansAdapter.sol";
import "../src/interfaces/IWormholeGuardiansAdapter.sol";
import "./mocks/MockEndpoint.sol";
import "./mocks/MockWormhole.sol";

contract WormholeGuardiansAdapterForTest is WormholeGuardiansAdapter {
    constructor(uint16 _ourChain, address _admin, address _endpoint, address _wormhole, uint8 _consistencyLevel)
        WormholeGuardiansAdapter(_ourChain, _admin, _endpoint, _wormhole, _consistencyLevel)
    {}

    function encodePayload(
        UniversalAddress srcAddr,
        uint64 sequence,
        uint16 dstChain,
        UniversalAddress dstAddr,
        bytes32 payloadHash
    ) external pure returns (bytes memory payload) {
        return _encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
    }

    function decodePayload(bytes memory payload)
        external
        pure
        returns (
            UniversalAddress srcAddr,
            uint64 sequence,
            uint16 dstChain,
            UniversalAddress dstAddr,
            bytes32 payloadHash
        )
    {
        return _decodePayload(payload);
    }
}

contract WormholeGuardiansAdapterTest is Test {
    address admin = address(0xabcdef);
    MockEndpoint srcEndpoint;
    MockEndpoint destEndpoint;
    address endpointAddr;
    address integratorAddr = address(0xabcded);
    address userA = address(0xabcdec);
    address someoneElse = address(0xabcdeb);
    MockWormhole srcWormhole;
    WormholeGuardiansAdapterForTest public srcAdapter;
    MockWormhole destWormhole;
    WormholeGuardiansAdapterForTest public destAdapter;
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
        srcWormhole = new MockWormhole(srcChain);
        srcAdapter =
            new WormholeGuardiansAdapterForTest(srcChain, admin, endpointAddr, address(srcWormhole), consistencyLevel);
        destWormhole = new MockWormhole(destChain);
        destAdapter = new WormholeGuardiansAdapterForTest(
            destChain, admin, address(destEndpoint), address(destWormhole), consistencyLevel
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
        require(address(srcAdapter.endpoint()) == endpointAddr, "srcEndpoint is not right");
        require(address(srcAdapter.wormhole()) == address(srcWormhole), "srcWormhole is not right");
        require(srcAdapter.consistencyLevel() == consistencyLevel, "consistencyLevel is not right");
    }

    function test_invalidInit() public {
        // ourChain can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapter(0, admin, address(destEndpoint), address(destWormhole), consistencyLevel);

        // admin can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapter(
            destChain, address(0), address(destEndpoint), address(destWormhole), consistencyLevel
        );

        // endpoint can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapter(destChain, admin, address(0), address(destWormhole), consistencyLevel);

        // wormhole can't be zero.
        vm.expectRevert();
        new WormholeGuardiansAdapter(destChain, admin, address(destEndpoint), address(0), consistencyLevel);
    }

    function test_updateAdmin() public {
        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, userA));
        srcAdapter.updateAdmin(someoneElse);

        // Can't set the admin to zero.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidAdminZeroAddress.selector));
        srcAdapter.updateAdmin(address(0));

        // This should work.
        vm.startPrank(admin);
        srcAdapter.updateAdmin(userA);
    }

    function test_transferAdmin() public {
        // Set up to do a receive below.
        vm.startPrank(admin);
        destAdapter.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcAdapter)).toBytes32());

        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, userA));
        srcAdapter.transferAdmin(someoneElse);

        // Transferring to address zero should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidAdminZeroAddress.selector));
        srcAdapter.transferAdmin(address(0));

        // This should work.
        vm.startPrank(admin);
        srcAdapter.transferAdmin(userA);

        // Attempting to do another transfer when one is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.AdminTransferPending.selector));
        srcAdapter.transferAdmin(someoneElse);

        // Attempting to update when a transfer is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.AdminTransferPending.selector));
        srcAdapter.updateAdmin(someoneElse);

        // Attempting to set a peer when a transfer is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.AdminTransferPending.selector));
        srcAdapter.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // But you can quote the delivery price while a transfer is pending.
        srcAdapter.quoteDeliveryPrice(peerChain1, new bytes(0));

        // And you can send a message while a transfer is pending.
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = destChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        address refundAddr = userA;
        uint256 deliverPrice = 382;

        vm.startPrank(endpointAddr);
        srcAdapter.sendMessage{value: deliverPrice}(
            srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr, new bytes(0)
        );

        // And you can receive a message while a transfer is pending.
        destAdapter.receiveMessage(srcWormhole.lastVaa());
    }

    function test_claimAdmin() public {
        // Can't claim when a transfer is not pending.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.NoAdminUpdatePending.selector));
        srcAdapter.claimAdmin();

        // Start a transfer.
        srcAdapter.transferAdmin(userA);

        // If someone other than the current or pending admin tries to claim, it should revert.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, someoneElse));
        srcAdapter.claimAdmin();

        // The admin claiming should cancel the transfer.
        vm.startPrank(admin);
        srcAdapter.claimAdmin();
        require(srcAdapter.admin() == admin, "cancel set the admin incorrectly");
        require(srcAdapter.pendingAdmin() == address(0), "cancel did not clear the pending admin");

        // The new admin claiming it should work.
        srcAdapter.transferAdmin(userA);
        vm.startPrank(userA);
        srcAdapter.claimAdmin();
        require(srcAdapter.admin() == userA, "transfer set the admin incorrectly");
        require(srcAdapter.pendingAdmin() == address(0), "transfer did not clear the pending admin");
    }

    function test_discardAdmin() public {
        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, userA));
        srcAdapter.discardAdmin();

        // This should work.
        vm.startPrank(admin);
        srcAdapter.discardAdmin();
        require(srcAdapter.admin() == address(0), "transfer set the admin incorrectly");
        require(srcAdapter.pendingAdmin() == address(0), "transfer did not clear the pending admin");

        // So now the old admin can't do anything.
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, admin));
        srcAdapter.updateAdmin(someoneElse);
    }

    function test_setPeer() public {
        // Only the admin can set a peer.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.CallerNotAdmin.selector, someoneElse));
        srcAdapter.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // Peer chain can't be zero.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidChain.selector, 0));
        srcAdapter.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // Peer contract can't be zero.
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidPeerZeroAddress.selector));
        srcAdapter.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(0)).toBytes32());

        // This should work.
        srcAdapter.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32());

        // You can't set a peer when it's already set.
        vm.expectRevert(
            abi.encodeWithSelector(IWormholeGuardiansAdapter.PeerAlreadySet.selector, peerChain1, peerAddress1)
        );
        srcAdapter.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32());

        // But you can set the peer for another chain.
        srcAdapter.setPeer(peerChain2, UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32());

        // Test the getter.
        require(
            srcAdapter.getPeer(peerChain1) == UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32(),
            "Peer for chain one is wrong"
        );
        require(
            srcAdapter.getPeer(peerChain2) == UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32(),
            "Peer for chain two is wrong"
        );

        // If you get a peer for a chain that's not set, it returns zero.
        require(
            srcAdapter.getPeer(peerChain3) == UniversalAddressLibrary.fromAddress(address(0)).toBytes32(),
            "Peer for chain three should not be set"
        );
    }

    function test_getAdapterType() public view {
        require(
            keccak256(abi.encodePacked(srcAdapter.getAdapterType()))
                == keccak256(abi.encodePacked(wormholeGuardiansAdapterVersionString)),
            "adapter type mismatch"
        );
    }

    function test_quoteDeliveryPrice() public view {
        require(
            srcAdapter.quoteDeliveryPrice(peerChain1, new bytes(0)) == srcWormhole.fixedMessageFee(),
            "message fee is wrong"
        );
    }

    function test_sendMessage() public {
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = peerChain1;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        address refundAddr = userA;
        uint256 deliverPrice = 382;

        vm.startPrank(endpointAddr);
        srcAdapter.sendMessage{value: deliverPrice}(
            srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr, new bytes(0)
        );

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
        srcAdapter.sendMessage{value: deliverPrice}(
            srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr, new bytes(0)
        );
    }

    function test_receiveMessage() public {
        // Set the peers on the adapters.
        vm.startPrank(admin);
        srcAdapter.setPeer(destChain, UniversalAddressLibrary.fromAddress(address(destAdapter)).toBytes32());
        destAdapter.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcAdapter)).toBytes32());

        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = destChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        address refundAddr = userA;
        uint256 deliverPrice = 382;

        vm.startPrank(endpointAddr);
        srcAdapter.sendMessage{value: deliverPrice}(
            srcAddr, sequence, dstChain, dstAddr, payloadHash, refundAddr, new bytes(0)
        );
        bytes memory vaa = srcWormhole.lastVaa();

        // This should work.
        destAdapter.receiveMessage(vaa);

        require(destEndpoint.lastSourceChain() == srcChain, "srcChain is wrong");
        require(destEndpoint.lastSourceAddress() == srcAddr, "srcAddr is wrong");
        require(destEndpoint.lastSequence() == sequence, "sequence is wrong");
        require(destEndpoint.lastDestinationChain() == dstChain, "dstChain is wrong");
        require(destEndpoint.lastDestinationAddress() == dstAddr, "dstAddr is wrong");
        require(destEndpoint.lastPayloadHash() == payloadHash, "payloadHash is wrong");

        // Can't post it to the wrong adapter.
        vm.expectRevert(
            abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidPeer.selector, srcChain, address(srcAdapter))
        );
        srcAdapter.receiveMessage(vaa);

        // An invalid VAA should revert.
        destWormhole.setValidFlag(false, "This is bad!");
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidVaa.selector, "This is bad!"));
        destAdapter.receiveMessage(vaa);
        destWormhole.setValidFlag(true, "");

        // The adapter should not block a message with the wrong dest chain because the endpoint does that.
        uint16 diffDestChain = destChain + 1;
        WormholeGuardiansAdapterForTest destAdapter2 = new WormholeGuardiansAdapterForTest(
            diffDestChain, admin, address(destEndpoint), address(destWormhole), consistencyLevel
        );
        vm.startPrank(admin);
        destAdapter2.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcAdapter)).toBytes32());
        vm.startPrank(integratorAddr);
        destAdapter2.receiveMessage(vaa);

        require(destEndpoint.lastSourceChain() == srcChain, "srcChain is wrong 2");
        require(destEndpoint.lastSourceAddress() == srcAddr, "srcAddr is wrong 2");
        require(destEndpoint.lastSequence() == sequence, "sequence is wrong 2");
        require(destEndpoint.lastDestinationChain() == dstChain, "dstChain in vaa is wrong");
        require(destEndpoint.lastDestinationAddress() == dstAddr, "dstAddr is wrong 2");
        require(destEndpoint.lastPayloadHash() == payloadHash, "payloadHash is wrong 2");
    }

    function test_encodeDecode() public {
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint64 sequence = 42;
        uint16 dstChain = srcChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        bytes32 payloadHash = keccak256("message one");

        bytes memory payload = srcAdapter.encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);

        (UniversalAddress sa, uint64 sn, uint16 rc, UniversalAddress ra, bytes32 ph) = srcAdapter.decodePayload(payload);

        require(sa == srcAddr, "srcAddr is wrong");
        require(sn == sequence, "sequence is wrong");
        require(rc == dstChain, "dstChain is wrong");
        require(ra == dstAddr, "dstAddr is wrong");
        require(ph == payloadHash, "payloadHash is wrong");

        // Decoding something too short should revert.
        bytes memory shortPayload =
            hex"0000000000000000000000000000000000000000000000000000000000abcdec000000000000002a002a";
        vm.expectRevert(abi.encodeWithSelector(BytesParsing.OutOfBounds.selector, 74, 42));
        (sa, sn, rc, ra, ph) = srcAdapter.decodePayload(shortPayload);

        // Decoding something too long should revert.
        bytes memory longPayload =
            hex"0000000000000000000000000000000000000000000000000000000000abcdec000000000000002a002a000000000000000000000000000000000000000000000000000000000012345687132a1dbfd52f44b829ebbfa86d87ecb427cb98320c7edd7a2a0f25b6b58a3500";
        vm.expectRevert(abi.encodeWithSelector(IWormholeGuardiansAdapter.InvalidPayloadLength.selector, 107, 106));
        (sa, sn, rc, ra, ph) = srcAdapter.decodePayload(longPayload);
    }

    function test_getPeers() public {
        vm.startPrank(admin);

        require(0 == srcAdapter.getPeers().length, "Initial peers should be zero");

        bytes32 peerAddr1 = UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32();
        bytes32 peerAddr2 = UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32();

        srcAdapter.setPeer(peerChain1, peerAddr1);
        IWormholeGuardiansAdapter.PeerEntry[] memory peers = srcAdapter.getPeers();
        require(1 == peers.length, "Should be one peer");
        require(peers[0].chain == peerChain1, "Chain is wrong");
        require(peers[0].addr == peerAddr1, "Address is wrong");

        srcAdapter.setPeer(peerChain2, peerAddr1);
        peers = srcAdapter.getPeers();
        require(2 == peers.length, "Should be one peer");
        require(peers[0].chain == peerChain1, "First chain is wrong");
        require(peers[0].addr == peerAddr1, "First address is wrong");
        require(peers[1].chain == peerChain2, "Second chain is wrong");
        require(peers[1].addr == peerAddr2, "Second address is wrong");
    }

    // function testFuzz_SetNumber(uint256 x) public {
    //     srcAdapter.setNumber(x);
    //     assertEq(srcAdapter.number(), x);
    // }
}
