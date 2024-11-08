import { ethers } from "ethers";
import { WormholeTransceiver__factory } from "../abi";

export async function consistencyLevel(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<bigint> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const level = await transceiver["consistencyLevel"]();

  return level;
}

export async function getTransceiverType(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<string> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const type = await transceiver["getTransceiverType"]();

  return type;
}

export async function ourChain(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<bigint> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const chain = await transceiver["ourChain"]();

  return chain;
}

export async function quoteDeliveryPrice(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  chain: number,
): Promise<bigint> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const type = await transceiver["quoteDeliveryPrice"](chain);

  return type;
}

export async function versionString(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<string> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const chain = await transceiver["versionString"]();

  return chain;
}
