import { ethers } from "ethers";
import {
  IWormholeGuardiansAdapter,
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapterWithExecutor,
} from "../../../abi";
import { getContract } from "./util";

export async function setPeer(
  contractAddress: string,
  signer: ethers.Signer,
  peerChain: number,
  peerContract: string,
): Promise<void> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );

  const tx = await contract.setPeer(peerChain, peerContract);
  await tx.wait();
}

export async function getPeers(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<IWormholeGuardiansAdapter.PeerEntryStructOutput[]> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );
  const result: IWormholeGuardiansAdapter.PeerEntryStructOutput[] =
    await contract.getPeers();
  return result;
}

export async function getPeer(
  contractAddress: string,
  signer: ethers.Signer,
  peerChain: number,
): Promise<string> {
  const contract:
    | WormholeGuardiansAdapter
    | WormholeGuardiansAdapterWithExecutor = await getContract(
    contractAddress,
    signer,
  );
  const result: string = await contract.getPeer(peerChain);
  return result;
}
