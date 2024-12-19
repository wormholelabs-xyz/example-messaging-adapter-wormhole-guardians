import { ethers } from "ethers";
import {
  WormholeGuardiansAdapter,
  WormholeGuardiansAdapter__factory,
  WormholeGuardiansAdapterWithExecutor,
  WormholeGuardiansAdapterWithExecutor__factory,
} from "../../../abi";

export async function isExecutor(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<boolean> {
  const abiFragment = ["function executor() public view returns (address)"];
  const contract = new ethers.Contract(contractAddress, abiFragment, signer);
  try {
    await contract.executor();
    return true;
  } catch {
    return false;
  }
}

export async function getContract(
  contractAddress: string,
  signer: ethers.Signer,
): Promise<WormholeGuardiansAdapter | WormholeGuardiansAdapterWithExecutor> {
  if (await isExecutor(contractAddress, signer)) {
    return WormholeGuardiansAdapterWithExecutor__factory.connect(
      contractAddress,
      signer,
    );
  } else {
    return WormholeGuardiansAdapter__factory.connect(contractAddress, signer);
  }
}
