import { ethers } from "ethers";
import {
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapter__factory,
  WormholeGuardiansAdapterWithExecutor,
  WormholeGuardiansAdapterWithExecutor__factory,
} from "../../../abi";

export async function claimAdmin(
  contractAddress: string,
  signer: ethers.Signer,
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
  const tx = await contract.claimAdmin();
  await tx.wait();
}

export async function discardAdmin(
  contractAddress: string,
  signer: ethers.Signer,
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
  const tx = await contract.discardAdmin();
  await tx.wait();
}

export async function pendingAdmin(
  contractAddress: string,
  signer: ethers.Signer,
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
  const result: string = await contract.pendingAdmin();
  return result;
}

export async function transferAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
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
  const tx = await contract.transferAdmin(newAdmin);
  await tx.wait();
}

export async function updateAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
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
  const tx = await contract.updateAdmin(newAdmin);
  await tx.wait();
}

export async function getAdapterType(
  contractAddress: string,
  signer: ethers.Signer,
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
  const result: string = await contract.getAdapterType();
  return result;
}

export async function amIExecutor(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<boolean> {
  const type: string = await getAdapterType(contractAddress, signer);
  // TODO:  See if this version string is somewhere in a const
  if (type === "WormholeGuardiansAdapterWithExecutor-0.0.1") {
    return true;
  }
  return false;
}
