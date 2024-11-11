# EVM Documentation

## Design

The WormholeGuardiansAdapter is responsible for sending and receiving messages for a [Modular Messaging Endpoint](https://github.com/wormholelabs-xyz/example-messaging-endpoint/blob/main/README.md) via the Wormhole core network.

The WormholeGuardiansAdapter contract is associated with exactly one Endpoint contract. It may be configured to support multiple peer adapters with at most one per chain. All peer contracts must implement the WormholeGuardiansAdapter message format as defined in `_encodePayload`. The peers are added by an admin contract. Once a peer is set for a chain, it may not be updated.

It is expected that the Endpoint will use this adapter to send messages.

This adapter expects to receive messages from external relayers. If a message is valid, the adapter will attest it to the endpoint.

Note that this adapter does not do replay protection because that is done by the endpoint.

### Constructor Parameters

All of these parameters are part of the contract state as public attributes so anyone may read them.

#### Chain Identifiers

The `ourChain` parameter specifies the Wormhole chain ID of the chain to which this WormholeGuardiansAdapter is deployed.

The `evmChain` parameters specifies the EVM chain ID of this chain. It is used to detect forks when attesting messages.

The chain values are immutable.

#### Endpoint

An Endpoint is the on-chain contract which will call `sendMessage` on the WormholeGuardiansAdapter. From the WormholeGuardiansAdapter perspective, the Endpoint is the `msg.sender` of `sendMessage`. Additionally, the WormholeGuardiansAdapter will call `attestMessage` on the Endpoint contract.

The Endpoint contract must implement that `IEndpointAdapter` interface. The Endpoint address is immutable.

#### Admin

The Admin contract is used to administer the WormholeGuardiansAdapter. The admin is the only contract that is allowed to call `setPeer`. Additionally, only the admin may call `updateAdmin`, `transferAdmin` and `discardAdmin` to update the admin contract.

#### Wormhole Contract

The Wormhole contract should be set to the canonical Wormhole Core contract on this chain. The Wormhole address is immutable. The WormholeGuardiansAdapter uses the Wormhole contract to quote the delivery price, send messages and validate received messages.

#### Consistency Level

The `consistencyLevel` parameter is passed into the `IWormhole` `publishMessage` call. It configures whether the Wormhole network should publish the message immediately (value 200), when the block is marked safe (value 201) or when the block is finalized (any other value). The consistency level is immutable.

### Contract Administration:

- The admin contract is set at construction time.
- Only the current admin may update the admin.
- The admin privileges may be transferred immediately using `updateAdmin`.
- The admin privileges may be transferred in a two step process using `transferAdmin`. This requires the new admin contract to call `claimAdmin` to actually become the admin contract.
- The current admin contract may cancel a transfer by calling `claimAdmin` with `msg.sender`.
- The current admin may discard the admin privileges by calling `discardAdmin`. This makes the WormholeGuardiansAdapter immutable, allowing not further peers to be set. THIS IS NOT REVERSIBLE.

### Other External Interfaces

- Any contract may call `getAdapterType` to get the string identifier of this adapter.
- Any contract may call `quoteDeliveryPrice` to compute the cost of delivering an endpoint message to the specified peer.
- The Endpoint may call `sendMessage` to send a message to a given connected peer.
- Any contract may call `receiveMessage` to post a message to the adapter. If the message is valid, the WormholeGuardiansAdapter will call `attestMessage` on the Endpoint.

- Any contract may call `getPeer` to determine if the WormholeGuardiansAdapter is connected to a given chain, and if so what is the peer address.
- Any contract may call `getPeers` to get a list of all connected peers.

### Message Format

The payload of the Wormhole messages consists of the following fields encoded using `abi.encodePacked`.

```code
		UniversalAddress srcAddr,
		uint64 sequence,
		uint16 dstChain,
		UniversalAddress dstAddr,
		bytes32 payloadHash
```

## Deployment and Administration

### Deploying the Wormhole Guardians Adapter Contract

The contract can be deployed using the following command.

```shell
evm$ RPC_URL= MNEMONIC= OUR_CHAIN_ID= EVM_CHAIN_ID= ADMIN= ROUTER= WORMHOLE= CONSISTENCY_LEVEL= ./sh/deployWormholeGuardiansAdapter.sh
```

Note that the deploy script uses `create2` to generate a deterministic contract address.

### Generating Flattened Source

If you need to generate flattened source to be used for contract verification, you can use the following command. The results will be in `evm/flattened`.

```shell
evm$ ./sh/flatten.sh
```

### Verifying the Wormhole Guardians Adapter Contract

To verify the WormholeGuardiansAdapter contract, do something like this:

```shell
evm$ forge verify-contract --etherscan-api-key $ETHERSCAN_KEY --verifier etherscan --chain sepolia --watch --constructor-args $(cast abi-encode "constructor(uint16,uint256,address,address,address,uint8)" 10002 11155111 0x49887A216375FDED17DC1aAAD4920c3777265614 0xB3375116c00873D3ED5781edFE304aC9cC75eA56 0x4a8bc80Ed5a4067f1CCf107057b8270E0c
C11A78 200)  0xB3375116c00873D3ED5781edFE304aC9cC75eA56 ./src/WormholeGuardiansAdapter.sol:WormholeGuardiansAdapter
```

### Configuring Peer Adapters

To configure a peer Wormhole Guardians Adapter for a given chain, you can use the following command.

```shell
evm$ RPC_URL= MNEMONIC= WGA_ADDR= PEER_CHAIN_ID= PEER_ADDR= ./sh/setPeer.sh
```

Note that `PEER_CHAIN_ID` is a Wormhole CHAIN ID and the `PEER_ADDR` is a `UniversalAddress` expressed as a `bytes32` beginning with `0x`.

## Development

### Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

### Documentation

https://book.getfoundry.sh/

### Usage

#### Build

```shell
$ forge build
```

#### Test

```shell
$ forge test
```

#### Format

```shell
$ forge fmt
```

#### Gas Snapshots

```shell
$ forge snapshot
```

#### Anvil

```shell
$ anvil
```

#### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

#### Cast

```shell
$ cast <subcommand>
```

#### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
