import { ethers } from "ethers";
import { WormholeGuardiansAdapterWithExecutor__factory } from "../../../abi/factories/WormholeGuardiansAdapterWithExecutor__factory";

export async function receiveMessage(
  contractAddress: string,
  signer: ethers.Signer,
  message: Uint8Array,
): Promise<void> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
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
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
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
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const result = await contract.quoteDeliveryPrice(destChain, instructions);
  return result;
}
