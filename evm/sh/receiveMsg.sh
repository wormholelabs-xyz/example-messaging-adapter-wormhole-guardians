#!/bin/bash

#
# This script submits a message to the WormholeTransceiver contract.
# Usage: RPC_URL= MNEMONIC= WT_ADDR= VAA= ./sh/receiveMsg.sh
#  tilt: WT_ADDR=0xdFccc9C59c7361307d47c558ffA75840B32DbA29 VAA= ./sh/receiveMsg.sh
#

[[ -z $WT_ADDR ]] && { echo "Missing WT_ADDR"; exit 1; }
[[ -z $VAA ]] && { echo "Missing VAA"; exit 1; }

if [ "${RPC_URL}X" == "X" ]; then
  RPC_URL=http://localhost:8545
fi

if [ "${MNEMONIC}X" == "X" ]; then
  MNEMONIC=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
fi

forge script ./script/ReceiveMsg.s.sol:ReceiveMsg \
	--sig "run(address,bytes)" $WT_ADDR $VAA \
	--rpc-url $RPC_URL \
	--private-key $MNEMONIC \
	--broadcast