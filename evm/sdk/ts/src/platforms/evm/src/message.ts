import { ethers } from "ethers";
import {
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapterWithExecutor,
} from "../../../abi";
import { getContract } from "./util";

export async function receiveMessage(
  contractAddress: string,
  signer: ethers.Signer,
  message: Uint8Array,
): Promise<void> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );
  const tx = await contract.receiveMessage(message);
  await tx.wait();
}

export async function sendMessage(
  contractAddress: string,
  signer: ethers.Signer,
  srcAddr: string,
  sequence: bigint,
  dstChain: number,
  dstAddr: string,
  payloadHash: string,
  refundAddr: string,
  instructions: Uint8Array,
): Promise<void> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );
  const tx = await contract.sendMessage(
    srcAddr,
    sequence,
    dstChain,
    dstAddr,
    payloadHash,
    refundAddr,
    instructions,
  );
  await tx.wait();
}

export async function quoteDeliveryPrice(
  contractAddress: string,
  signer: ethers.Signer,
  destChain: number,
  instructions: string,
): Promise<bigint> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );
  const result = await contract.quoteDeliveryPrice(destChain, instructions);
  return result;
}
