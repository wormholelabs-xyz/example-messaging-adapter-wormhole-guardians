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
): Promise<void> {
  let contract = await getContract(contractAddress, signer);
  const tx = await contract.claimAdmin();
  await tx.wait();
}

export async function discardAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<void> {
  let contract = await getContract(contractAddress, signer);
  const tx = await contract.discardAdmin();
  await tx.wait();
}

export async function pendingAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  let contract = await getContract(contractAddress, signer);
  return await contract.pendingAdmin();
}

export async function transferAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  let contract = await getContract(contractAddress, signer);
  const tx = await contract.transferAdmin(newAdmin);
  await tx.wait();
}

export async function updateAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  let contract = await getContract(contractAddress, signer);
  const tx = await contract.updateAdmin(newAdmin);
  await tx.wait();
}

export async function getAdapterType(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  let contract = await getContract(contractAddress, signer);
  return await contract.getAdapterType();
}

export async function amIExecutor(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<boolean> {
  try {
    const type: string = await getAdapterType(contractAddress, signer);
    // TODO:  See if this version string is somewhere in a const
    if (type === "WormholeGuardiansAdapterWithExecutor-0.0.1") {
      return true;
    }
  } catch (e) {
    console.log("Error getting adapter type", e);
  }
  return false;
}

async function getContract(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<WormholeGuardiansAdapter | WormholeGuardiansAdapterWithExecutor> {
  try {
    return WormholeGuardiansAdapterWithExecutor__factory.connect(
      contractAddress,
      signer,
    );
  } catch (e) {
    console.log("Error connecting to contract with executor", e);
  }
  try {
    return WormholeGuardiansAdapter__factory.connect(contractAddress, signer);
  } catch (e) {
    console.log("Error connecting to contract without executor", e);
  }
  throw new Error(
    `Contract address ${contractAddress} is not a WormholeGuardiansAdapter or WormholeGuardiansAdapterWithExecutor contract`,
  );
}
