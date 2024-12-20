import { ethers } from "ethers";
import { IWormholeTransceiver, WormholeTransceiver__factory } from "../abi";

export async function getPeer(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  chain: number,
): Promise<string> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const peer = await transceiver["getPeer"](chain);

  return peer;
}

export async function getPeers(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<IWormholeTransceiver.PeerEntryStructOutput[]> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const peers = await transceiver["getPeers"]();

  return peers;
}

export async function setPeer(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  peerChain: number,
  peerContract: string,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["setPeer"](peerChain, peerContract);
}
