// To execute this file, you need to run the following command:
// npx tsx freeShow.ts

import { ethers } from "ethers";
import { admin, pendingAdmin } from "../contracts/admin";
import { getPeer, getPeers } from "../contracts/peers";

const networks = [
  {
    name: "Base",
    rpc: "https://base-sepolia-rpc.publicnode.com",
    whTransceiver: "0xD19bB37fb212D5799895725D1858Fa4Ab2fcA1A7",
    peer: 10002,
  },
  {
    name: "Sepolia",
    rpc: "https://rpc-sepolia.rockx.com",
    whTransceiver: "0x5Fa768AF5994995cE2D3FF7F300E83855107cF0d",
    peer: 10004,
  },
];

function getProvider(rpc: string) {
  return new ethers.JsonRpcProvider(rpc);
}

(async () => {
  for (const network of networks) {
    console.log(`\n\nNetwork: ${network.name}`);
    console.log(`RPC URL: ${network.rpc}`);
    console.log(`WH Transceiver: ${network.whTransceiver}`);
		const provider = getProvider(network.rpc);
    const adminAddr = await admin(
      network.whTransceiver,
      provider,
    );
    console.log("Admin:", adminAddr);

    const pendAdmin = await pendingAdmin(
      network.whTransceiver,
      provider,
    );
    console.log("pendingAdmin:", pendAdmin);

    const peer = await getPeer(
      network.whTransceiver,
      provider,
      network.peer,
    );
    console.log("Peer:", peer);

		const peers = await getPeers(
      network.whTransceiver,
      provider,
    );
    console.log("Peers:", peers);
  }
})();
