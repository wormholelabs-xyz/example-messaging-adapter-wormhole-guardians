import { ethers } from "ethers";
import { WormholeTransceiver__factory } from "../abi";

export async function receiveMessage(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  encodedMessage: Uint8Array,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["receiveMessage"](encodedMessage);
}

export async function sendMessage(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  srcAddr: string,
  sequence: bigint,
  dstChain: number,
  dstAddr: string,
  payloadHash: Uint8Array,
  refundAddr: string,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["sendMessage"](
    srcAddr,
    sequence,
    dstChain,
    dstAddr,
    payloadHash,
    refundAddr,
  );
}
