#!/bin/bash

#
# This script deploys the WormholeGuardiansAdapter contract.
# Usage: RPC_URL= MNEMONIC= OUR_CHAIN_ID= EVM_CHAIN_ID= ADMIN= ENDPOINT= WORMHOLE= CONSISTENCY_LEVEL= ./sh/deployWormholeGuardiansAdapter.sh
#  tilt: ENDPOINT=0x1aBE68277AE236083947f2551FEe8b885efCA8f5 ./sh/deployWormholeGuardiansAdapter.sh
#

[[ -z $ENDPOINT ]] && { echo "Missing ENDPOINT"; exit 1; }

if [ "${RPC_URL}X" == "X" ]; then
  RPC_URL=http://localhost:8545
fi

if [ "${MNEMONIC}X" == "X" ]; then
  MNEMONIC=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
fi

if [ "${OUR_CHAIN_ID}X" == "X" ]; then
  OUR_CHAIN_ID=2
fi

if [ "${EVM_CHAIN_ID}X" == "X" ]; then
  EVM_CHAIN_ID=1337
fi

if [ "${ADMIN}X" == "X" ]; then
  ADMIN=0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
fi

if [ "${WORMHOLE}X" == "X" ]; then
  WORMHOLE=0xC89Ce4735882C9F0f0FE26686c53074E09B0D550
fi

if [ "${CONSISTENCY_LEVEL}X" == "X" ]; then
  CONSISTENCY_LEVEL=200
fi

forge script ./script/DeployWormholeGuardiansAdapter.s.sol:DeployWormholeGuardiansAdapter \
	--sig "run(uint16,address,address,address,uint8)" $OUR_CHAIN_ID $ADMIN $ENDPOINT $WORMHOLE $CONSISTENCY_LEVEL \
	--rpc-url "$RPC_URL" \
	--private-key "$MNEMONIC" \
	--broadcast ${FORGE_ARGS}

returnInfo=$(cat ./broadcast/DeployWormholeGuardiansAdapter.s.sol/$EVM_CHAIN_ID/run-latest.json)

DEPLOYED_ADDRESS=$(jq -r '.returns.deployedAddress.value' <<< "$returnInfo")
echo "Deployed adapter address: $DEPLOYED_ADDRESS"
