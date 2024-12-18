import { ethers } from "ethers";
import { WormholeTransceiver__factory } from "../abi";

export async function admin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<string> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const admin = await transceiver["admin"]();

  return admin;
}

export async function claimAdmin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["claimAdmin"]();
}

export async function discardAdmin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["discardAdmin"]();
}

export async function pendingAdmin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
): Promise<string> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  const admin = await transceiver["pendingAdmin"]();

  return admin;
}

export async function transferAdmin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["transferAdmin"](newAdmin);
}

export async function updateAdmin(
  contractAddress: string,
  provider: ethers.Provider | ethers.Signer,
  newAdmin: string,
): Promise<void> {
  const transceiver = WormholeTransceiver__factory.connect(
    contractAddress,
    provider,
  );

  await transceiver["updateAdmin"](newAdmin);
}
