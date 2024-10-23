#!/bin/bash

#
# This script sets the peer for a given chain with the WormholeTransceiver contract.
# Usage: RPC_URL= MNEMONIC= WT_ADDR= PEER_CHAIN_ID= PEER_ADDR= ./sh/setPeer.sh
#  tilt: WT_ADDR=0xdFccc9C59c7361307d47c558ffA75840B32DbA29 PEER_CHAIN_ID=4 PEER_ADDR=0x00000000000000000000000090F8bf6A479f320ead074411a4B0e7944Ea8c9C1 ./sh/setPeer.sh
#

[[ -z $WT_ADDR ]] && { echo "Missing WT_ADDR"; exit 1; }
[[ -z $PEER_CHAIN_ID ]] && { echo "Missing PEER_CHAIN_ID"; exit 1; }
[[ -z $PEER_ADDR ]] && { echo "Missing PEER_ADDR"; exit 1; }

if [ "${RPC_URL}X" == "X" ]; then
  RPC_URL=http://localhost:8545
fi

if [ "${MNEMONIC}X" == "X" ]; then
  MNEMONIC=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
fi

forge script ./script/SetPeer.s.sol:SetPeer \
	--sig "run(address,uint16,bytes32)" $WT_ADDR $PEER_CHAIN_ID $PEER_ADDR \
	--rpc-url $RPC_URL \
	--private-key $MNEMONIC \
	--broadcast
