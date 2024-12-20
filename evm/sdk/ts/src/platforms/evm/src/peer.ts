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
  // The contract expects peerContract to be a bytes32.
  // Do some length checking here.
  // The peerContract is a 0x-prefixed hex string.
  if (peerContract.length !== 66) {
    throw new Error(
      "peerContract must be a bytes32 hex string prefixed with 0x",
    );
  }
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
