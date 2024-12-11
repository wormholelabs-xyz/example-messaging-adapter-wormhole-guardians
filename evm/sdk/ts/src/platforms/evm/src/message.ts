import { ethers } from "ethers";
import {
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapter__factory,
  WormholeGuardiansAdapterWithExecutor,
  WormholeGuardiansAdapterWithExecutor__factory,
} from "../../../abi";

export async function receiveMessage(
  contractAddress: string,
  signer: ethers.Signer,
  message: Uint8Array,
  withExecutor: boolean = true,
): Promise<void> {
  let contract: WormholeGuardiansAdapter | WormholeGuardiansAdapterWithExecutor;
  if (withExecutor) {
    contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
      contractAddress,
      signer,
    );
  } else {
    contract = WormholeGuardiansAdapter__factory.connect(
      contractAddress,
      signer,
    );
  }
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
  withExecutor: boolean = true,
): Promise<void> {
  let contract: WormholeGuardiansAdapter | WormholeGuardiansAdapterWithExecutor;
  if (withExecutor) {
    contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
      contractAddress,
      signer,
    );
  } else {
    contract = WormholeGuardiansAdapter__factory.connect(
      contractAddress,
      signer,
    );
  }
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
  withExecutor: boolean = true,
): Promise<bigint> {
  let contract: WormholeGuardiansAdapter | WormholeGuardiansAdapterWithExecutor;
  if (withExecutor) {
    contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
      contractAddress,
      signer,
    );
  } else {
    contract = WormholeGuardiansAdapter__factory.connect(
      contractAddress,
      signer,
    );
  }
  const result = await contract.quoteDeliveryPrice(destChain, instructions);
  return result;
}
