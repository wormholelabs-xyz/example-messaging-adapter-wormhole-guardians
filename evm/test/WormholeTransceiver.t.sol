// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "wormhole-solidity-sdk/libraries/BytesParsing.sol";
import "wormhole-solidity-sdk/interfaces/IWormhole.sol";
import "example-gmp-router/libraries/UniversalAddress.sol";
import "../src/WormholeTransceiver.sol";
import "../src/interfaces/IWormholeTransceiver.sol";

contract WormholeTransceiverForTest is WormholeTransceiver {
    constructor(
        uint16 _ourChain,
        uint256 _ourevmChain,
        address _admin,
        address _router,
        address srcWormhole,
        uint8 _consistencyLevel
    ) WormholeTransceiver(_ourChain, _ourevmChain, _admin, _router, srcWormhole, _consistencyLevel) {}

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

contract MockWormhole {
    uint256 public constant fixedMessageFee = 250;

    uint16 public immutable ourChain;

    bool public validFlag;
    string public invalidReason;

    // These are incremented on calls.
    uint256 public messagesSent;
    uint32 public seqSent;

    // These are set on calls.
    uint256 public lastDeliveryPrice;
    uint32 public lastNonce;
    uint8 public lastConsistencyLevel;
    bytes public lastPayload;
    bytes public lastVaa;
    bytes32 public lastVaaHash;

    constructor(uint16 _ourChain) {
        ourChain = _ourChain;
        validFlag = true;
    }

    function setValidFlag(bool v, string memory reason) external {
        validFlag = v;
        invalidReason = reason;
    }

    function messageFee() external pure returns (uint256) {
        return fixedMessageFee;
    }

    function publishMessage(uint32 nonce, bytes memory payload, uint8 consistencyLevel)
        external
        payable
        returns (uint64 sequence)
    {
        seqSent += 1;
        sequence = seqSent;

        lastDeliveryPrice = msg.value;
        lastNonce = nonce;
        lastConsistencyLevel = consistencyLevel;
        lastPayload = payload;
        messagesSent += 1;

        bytes32 sender = UniversalAddressLibrary.fromAddress(msg.sender).toBytes32();
        bytes32 hash = keccak256(payload);

        lastVaa = abi.encode(ourChain, sender, sequence, hash, payload);
        lastVaaHash = hash;
    }

    function parseAndVerifyVM(bytes calldata encodedVM)
        external
        view
        returns (IWormhole.VM memory vm, bool valid, string memory reason)
    {
        valid = validFlag;
        reason = invalidReason;

        // These are the fields that the transceiver uses:
        // vm.emitterChainId
        // vm.emitterAddress
        // vm.hash
        // vm.payload

        (vm.emitterChainId, vm.emitterAddress, vm.sequence, vm.hash, vm.payload) =
            abi.decode(encodedVM, (uint16, bytes32, uint64, bytes32, bytes));
    }
}

contract MockRouter {
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

contract WormholeTransceiverTest is Test {
    address admin = address(0xabcdef);
    MockRouter srcRouter;
    MockRouter destRouter;
    address routerAddr;
    address integratorAddr = address(0xabcded);
    address userA = address(0xabcdec);
    address someoneElse = address(0xabcdeb);
    MockWormhole srcWormhole;
    WormholeTransceiverForTest public srcTransceiver;
    MockWormhole destWormhole;
    WormholeTransceiverForTest public destTransceiver;
    uint8 consistencyLevel = 200;

    uint16 ourChain = 42;
    uint256 ourevmChain = 31337;

    uint16 srcChain = 42;
    uint16 destChain = 43;

    uint16 peerChain1 = 1;
    address peerAddress1 = address(0x123456);

    uint16 peerChain2 = 2;
    address peerAddress2 = address(0x123456);

    uint16 peerChain3 = 3;

    function setUp() public {
        srcRouter = new MockRouter(srcChain);
        routerAddr = address(srcRouter);
        destRouter = new MockRouter(destChain);
        srcWormhole = new MockWormhole(srcChain);
        srcTransceiver = new WormholeTransceiverForTest(
            srcChain, ourevmChain, admin, routerAddr, address(srcWormhole), consistencyLevel
        );
        destWormhole = new MockWormhole(destChain);
        destTransceiver = new WormholeTransceiverForTest(
            destChain, ourevmChain, admin, address(destRouter), address(destWormhole), consistencyLevel
        );

        // Give everyone some money to play with.
        vm.deal(integratorAddr, 1 ether);
        vm.deal(routerAddr, 1 ether);
        vm.deal(userA, 1 ether);
        vm.deal(someoneElse, 1 ether);
    }

    function test_init() public view {
        require(srcTransceiver.ourChain() == ourChain, "ourChain is not right");
        require(srcTransceiver.admin() == admin, "admin is not right");
        require(address(srcTransceiver.router()) == routerAddr, "srcRouter is not right");
        require(address(srcTransceiver.wormhole()) == address(srcWormhole), "srcWormhole is not right");
        require(srcTransceiver.consistencyLevel() == consistencyLevel, "consistencyLevel is not right");
    }

    function test_invalidInit() public {
        // ourChain can't be zero.
        vm.expectRevert();
        new WormholeTransceiver(0, ourevmChain, admin, address(destRouter), address(destWormhole), consistencyLevel);

        // evmChain can't be zero.
        vm.expectRevert();
        new WormholeTransceiver(destChain, 0, admin, address(destRouter), address(destWormhole), consistencyLevel);

        // admin can't be zero.
        vm.expectRevert();
        new WormholeTransceiver(
            destChain, ourevmChain, address(0), address(destRouter), address(destWormhole), consistencyLevel
        );

        // router can't be zero.
        vm.expectRevert();
        new WormholeTransceiver(destChain, ourevmChain, admin, address(0), address(destWormhole), consistencyLevel);

        // wormhole can't be zero.
        vm.expectRevert();
        new WormholeTransceiver(destChain, ourevmChain, admin, address(destRouter), address(0), consistencyLevel);
    }

    function test_updateAdmin() public {
        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, userA));
        srcTransceiver.updateAdmin(someoneElse);

        // Can't set the admin to zero.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidAdminZeroAddress.selector));
        srcTransceiver.updateAdmin(address(0));

        // This should work.
        vm.startPrank(admin);
        srcTransceiver.updateAdmin(userA);
    }

    function test_transferAdmin() public {
        // Set up to do a receive below.
        vm.startPrank(admin);
        destTransceiver.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcTransceiver)).toBytes32());

        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, userA));
        srcTransceiver.transferAdmin(someoneElse);

        // Transferring to address zero should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidAdminZeroAddress.selector));
        srcTransceiver.transferAdmin(address(0));

        // This should work.
        vm.startPrank(admin);
        srcTransceiver.transferAdmin(userA);

        // Attempting to do another transfer when one is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.AdminTransferPending.selector));
        srcTransceiver.transferAdmin(someoneElse);

        // Attempting to update when a transfer is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.AdminTransferPending.selector));
        srcTransceiver.updateAdmin(someoneElse);

        // Attempting to set a peer when a transfer is in progress should revert.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.AdminTransferPending.selector));
        srcTransceiver.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // But you can quote the delivery price while a transfer is pending.
        srcTransceiver.quoteDeliveryPrice(peerChain1);

        // And you can send a message while a transfer is pending.
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = destChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        bytes32 refundAddr = UniversalAddressLibrary.fromAddress(address(userA)).toBytes32();
        uint256 deliverPrice = 382;

        vm.startPrank(routerAddr);
        srcTransceiver.sendMessage{value: deliverPrice}(srcAddr, dstChain, dstAddr, sequence, payloadHash, refundAddr);

        // And you can receive a message while a transfer is pending.
        destTransceiver.receiveMessage(srcWormhole.lastVaa());
    }

    function test_claimAdmin() public {
        // Can't claim when a transfer is not pending.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.NoAdminUpdatePending.selector));
        srcTransceiver.claimAdmin();

        // Start a transfer.
        srcTransceiver.transferAdmin(userA);

        // If someone other than the current or pending admin tries to claim, it should revert.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, someoneElse));
        srcTransceiver.claimAdmin();

        // The admin claiming should cancel the transfer.
        vm.startPrank(admin);
        srcTransceiver.claimAdmin();
        require(srcTransceiver.admin() == admin, "cancel set the admin incorrectly");
        require(srcTransceiver.pendingAdmin() == address(0), "cancel did not clear the pending admin");

        // The new admin claiming it should work.
        srcTransceiver.transferAdmin(userA);
        vm.startPrank(userA);
        srcTransceiver.claimAdmin();
        require(srcTransceiver.admin() == userA, "transfer set the admin incorrectly");
        require(srcTransceiver.pendingAdmin() == address(0), "transfer did not clear the pending admin");
    }

    function test_discardAdmin() public {
        // Only the admin can initiate this call.
        vm.startPrank(userA);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, userA));
        srcTransceiver.discardAdmin();

        // This should work.
        vm.startPrank(admin);
        srcTransceiver.discardAdmin();
        require(srcTransceiver.admin() == address(0), "transfer set the admin incorrectly");
        require(srcTransceiver.pendingAdmin() == address(0), "transfer did not clear the pending admin");

        // So now the old admin can't do anything.
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, admin));
        srcTransceiver.updateAdmin(someoneElse);
    }

    function test_setPeer() public {
        // Only the admin can set a peer.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.CallerNotAdmin.selector, someoneElse));
        srcTransceiver.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // Peer chain can't be zero.
        vm.startPrank(admin);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidChain.selector, 0));
        srcTransceiver.setPeer(0, UniversalAddressLibrary.fromAddress(peerAddress1).toBytes32());

        // Peer contract can't be zero.
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidPeerZeroAddress.selector));
        srcTransceiver.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(0)).toBytes32());

        // This should work.
        srcTransceiver.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32());

        // You can't set a peer when it's already set.
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.PeerAlreadySet.selector, peerChain1, peerAddress1));
        srcTransceiver.setPeer(peerChain1, UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32());

        // But you can set the peer for another chain.
        srcTransceiver.setPeer(peerChain2, UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32());

        // Test the getter.
        require(
            srcTransceiver.getPeer(peerChain1) == UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32(),
            "Peer for chain one is wrong"
        );
        require(
            srcTransceiver.getPeer(peerChain2) == UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32(),
            "Peer for chain two is wrong"
        );

        // If you get a peer for a chain that's not set, it returns zero.
        require(
            srcTransceiver.getPeer(peerChain3) == UniversalAddressLibrary.fromAddress(address(0)).toBytes32(),
            "Peer for chain three should not be set"
        );
    }

    function test_getTransceiverType() public view {
        require(
            keccak256(abi.encodePacked(srcTransceiver.getTransceiverType()))
                == keccak256(abi.encodePacked(srcTransceiver.versionString())),
            "srcTransceiver type mismatch"
        );
    }

    function test_quoteDeliveryPrice() public view {
        require(srcTransceiver.quoteDeliveryPrice(peerChain1) == srcWormhole.fixedMessageFee(), "message fee is wrong");
    }

    function test_sendMessage() public {
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = peerChain1;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        bytes32 refundAddr = UniversalAddressLibrary.fromAddress(address(userA)).toBytes32();
        uint256 deliverPrice = 382;

        vm.startPrank(routerAddr);
        srcTransceiver.sendMessage{value: deliverPrice}(srcAddr, dstChain, dstAddr, sequence, payloadHash, refundAddr);

        require(srcWormhole.messagesSent() == 1, "Message count is wrong");
        require(srcWormhole.lastNonce() == 0, "Nonce is wrong");
        require(srcWormhole.lastConsistencyLevel() == consistencyLevel, "Consistency level is wrong");
        require(srcWormhole.lastDeliveryPrice() == deliverPrice, "Deliver price is wrong");

        bytes memory expectedPayload = srcTransceiver.encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);
        require(
            keccak256(abi.encodePacked(srcWormhole.lastPayload())) == keccak256(expectedPayload), "Payload is wrong"
        );

        // Only the router can call send message.
        vm.startPrank(someoneElse);
        vm.expectRevert(abi.encodeWithSelector(ITransceiver.CallerNotRouter.selector, someoneElse));
        srcTransceiver.sendMessage{value: deliverPrice}(srcAddr, dstChain, dstAddr, sequence, payloadHash, refundAddr);
    }

    function test_receiveMessage() public {
        // Set the peers on the transceivers.
        vm.startPrank(admin);
        srcTransceiver.setPeer(destChain, UniversalAddressLibrary.fromAddress(address(destTransceiver)).toBytes32());
        destTransceiver.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcTransceiver)).toBytes32());

        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint16 dstChain = destChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        uint64 sequence = 42;
        bytes32 payloadHash = keccak256("message one");
        bytes32 refundAddr = UniversalAddressLibrary.fromAddress(address(userA)).toBytes32();
        uint256 deliverPrice = 382;

        vm.startPrank(routerAddr);
        srcTransceiver.sendMessage{value: deliverPrice}(srcAddr, dstChain, dstAddr, sequence, payloadHash, refundAddr);
        bytes memory vaa = srcWormhole.lastVaa();

        // This should work.
        destTransceiver.receiveMessage(vaa);

        require(destRouter.lastSourceChain() == srcChain, "srcChain is wrong");
        require(destRouter.lastSourceAddress() == srcAddr, "srcAddr is wrong");
        require(destRouter.lastSequence() == sequence, "sequence is wrong");
        require(destRouter.lastDestinationChain() == dstChain, "dstChain is wrong");
        require(destRouter.lastDestinationAddress() == dstAddr, "dstAddr is wrong");
        require(destRouter.lastPayloadHash() == payloadHash, "payloadHash is wrong");

        // Can't post it to the wrong transceiver.
        vm.expectRevert(
            abi.encodeWithSelector(IWormholeTransceiver.InvalidPeer.selector, srcChain, address(srcTransceiver))
        );
        srcTransceiver.receiveMessage(vaa);

        // An invalid VAA should revert.
        destWormhole.setValidFlag(false, "This is bad!");
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidVaa.selector, "This is bad!"));
        destTransceiver.receiveMessage(vaa);
        destWormhole.setValidFlag(true, "");

        // Can't post to the wrong chain.
        WormholeTransceiverForTest destTransceiver2 = new WormholeTransceiverForTest(
            destChain + 1, ourevmChain, admin, address(destRouter), address(destWormhole), consistencyLevel
        );
        vm.startPrank(admin);
        destTransceiver2.setPeer(srcChain, UniversalAddressLibrary.fromAddress(address(srcTransceiver)).toBytes32());
        vm.startPrank(integratorAddr);
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidChain.selector, destChain));
        destTransceiver2.receiveMessage(vaa);
    }

    function test_encodeDecode() public {
        UniversalAddress srcAddr = UniversalAddressLibrary.fromAddress(address(userA));
        uint64 sequence = 42;
        uint16 dstChain = srcChain;
        UniversalAddress dstAddr = UniversalAddressLibrary.fromAddress(address(peerAddress1));
        bytes32 payloadHash = keccak256("message one");

        bytes memory payload = srcTransceiver.encodePayload(srcAddr, sequence, dstChain, dstAddr, payloadHash);

        (UniversalAddress sa, uint64 sn, uint16 rc, UniversalAddress ra, bytes32 ph) =
            srcTransceiver.decodePayload(payload);

        require(sa == srcAddr, "srcAddr is wrong");
        require(sn == sequence, "sequence is wrong");
        require(rc == dstChain, "dstChain is wrong");
        require(ra == dstAddr, "dstAddr is wrong");
        require(ph == payloadHash, "payloadHash is wrong");

        // Decoding something too short should revert.
        bytes memory shortPayload =
            hex"0000000000000000000000000000000000000000000000000000000000abcdec000000000000002a002a";
        vm.expectRevert(abi.encodeWithSelector(BytesParsing.OutOfBounds.selector, 74, 42));
        (sa, sn, rc, ra, ph) = srcTransceiver.decodePayload(shortPayload);

        // Decoding something too long should revert.
        bytes memory longPayload =
            hex"0000000000000000000000000000000000000000000000000000000000abcdec000000000000002a002a000000000000000000000000000000000000000000000000000000000012345687132a1dbfd52f44b829ebbfa86d87ecb427cb98320c7edd7a2a0f25b6b58a3500";
        vm.expectRevert(abi.encodeWithSelector(IWormholeTransceiver.InvalidPayloadLength.selector, 107, 106));
        (sa, sn, rc, ra, ph) = srcTransceiver.decodePayload(longPayload);
    }

    function test_getPeers() public {
        vm.startPrank(admin);

        require(0 == srcTransceiver.getPeers().length, "Initial peers should be zero");

        bytes32 peerAddr1 = UniversalAddressLibrary.fromAddress(address(peerAddress1)).toBytes32();
        bytes32 peerAddr2 = UniversalAddressLibrary.fromAddress(address(peerAddress2)).toBytes32();

        srcTransceiver.setPeer(peerChain1, peerAddr1);
        IWormholeTransceiver.PeerEntry[] memory peers = srcTransceiver.getPeers();
        require(1 == peers.length, "Should be one peer");
        require(peers[0].chain == peerChain1, "Chain is wrong");
        require(peers[0].addr == peerAddr1, "Address is wrong");

        srcTransceiver.setPeer(peerChain2, peerAddr1);
        peers = srcTransceiver.getPeers();
        require(2 == peers.length, "Should be one peer");
        require(peers[0].chain == peerChain1, "First chain is wrong");
        require(peers[0].addr == peerAddr1, "First address is wrong");
        require(peers[1].chain == peerChain2, "Second chain is wrong");
        require(peers[1].addr == peerAddr2, "Second address is wrong");
    }

    // function testFuzz_SetNumber(uint256 x) public {
    //     srcTransceiver.setNumber(x);
    //     assertEq(srcTransceiver.number(), x);
    // }
}
