import { ethers } from "ethers";
import { getContract } from "./util";

export async function claimAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<void> {
  const contract = await getContract(contractAddress, signer);
  const tx = await contract.claimAdmin();
  await tx.wait();
}

export async function discardAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<void> {
  const contract = await getContract(contractAddress, signer);
  const tx = await contract.discardAdmin();
  await tx.wait();
}

export async function getAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = await getContract(contractAddress, signer);
  return await contract.admin();
}

export async function getPendingAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = await getContract(contractAddress, signer);
  return await contract.pendingAdmin();
}

export async function pendingAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = await getContract(contractAddress, signer);
  return await contract.pendingAdmin();
}

export async function transferAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const contract = await getContract(contractAddress, signer);
  const tx = await contract.transferAdmin(newAdmin);
  await tx.wait();
}

export async function updateAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const contract = await getContract(contractAddress, signer);
  const tx = await contract.updateAdmin(newAdmin);
  await tx.wait();
}

export async function getAdapterType(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = await getContract(contractAddress, signer);
  return await contract.getAdapterType();
}
