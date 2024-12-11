import { ethers } from "ethers";
import { WormholeGuardiansAdapterWithExecutor__factory } from "../../../abi/factories/WormholeGuardiansAdapterWithExecutor__factory";

export async function claimAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<void> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const tx = await contract.claimAdmin();
  await tx.wait();
}

export async function discardAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<void> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const tx = await contract.discardAdmin();
  await tx.wait();
}

export async function pendingAdmin(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const result: string = await contract.pendingAdmin();
  return result;
}

export async function transferAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const tx = await contract.transferAdmin(newAdmin);
  await tx.wait();
}

export async function updateAdmin(
  contractAddress: string,
  signer: ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const tx = await contract.updateAdmin(newAdmin);
  await tx.wait();
}

export async function getAdapterType(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<string> {
  const contract = WormholeGuardiansAdapterWithExecutor__factory.connect(
    contractAddress,
    signer,
  );
  const result: string = await contract.getAdapterType();
  return result;
}
