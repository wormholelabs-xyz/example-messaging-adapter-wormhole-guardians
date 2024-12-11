import { ethers } from "ethers";
import {
  IWormholeGuardiansAdapter,
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapter__factory,
  WormholeGuardiansAdapterWithExecutor,
  WormholeGuardiansAdapterWithExecutor__factory,
} from "../../../abi";

export async function setPeer(
  contractAddress: string,
  signer: ethers.Signer,
  peerChain: number,
  peerContract: string,
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
  const tx = await contract.setPeer(peerChain, peerContract);
  await tx.wait();
}

export async function getPeers(
  contractAddress: string,
  signer: ethers.Signer,
  withExecutor: boolean = true,
): Promise<IWormholeGuardiansAdapter.PeerEntryStructOutput[]> {
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
  const result: IWormholeGuardiansAdapter.PeerEntryStructOutput[] =
    await contract.getPeers();
  return result;
}

export async function getPeer(
  contractAddress: string,
  signer: ethers.Signer,
  peerChain: number,
  withExecutor: boolean = true,
): Promise<string> {
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
  const result: string = await contract.getPeer(peerChain);
  return result;
}
