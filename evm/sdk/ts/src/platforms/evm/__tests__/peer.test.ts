import { jest, expect, test } from "@jest/globals";
import { ethers } from "ethers";
import { getPeer, getPeers, setPeer } from "../src/peer";

jest.setTimeout(180000);

const fakePeer =
  "0x0000000000000000000000001B5Ba8B47e656Afe522634ca7F058b2BE33075Af".toLowerCase();
const nullPeer =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const anvilPrivateKey =
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const anvilEthProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const anvilEthSigner = new ethers.Wallet(anvilPrivateKey, anvilEthProvider);
const anvilWhGuardiansAdapter = "0x37DFeB004c7C76C8cE4954D1659A63ACd222d2Be";

describe("setPeer", () => {
  test("setPeer, getPeer, getPeers", async () => {
    const peerChain = 1;
    let peer: string = await getPeer(
      anvilWhGuardiansAdapter,
      anvilEthSigner,
      peerChain,
    );
    console.log("peer", peer);
    expect(peer).toBe(nullPeer);

    let peers = await getPeers(anvilWhGuardiansAdapter, anvilEthSigner);
    console.log("peers", peers);
    expect(peers.length).toBe(0);

    await setPeer(anvilWhGuardiansAdapter, anvilEthSigner, peerChain, fakePeer);

    peer = await getPeer(anvilWhGuardiansAdapter, anvilEthSigner, peerChain);
    console.log("peer after set", peer);
    expect(peer).toBe(fakePeer);

    peers = await getPeers(anvilWhGuardiansAdapter, anvilEthSigner);
    console.log("peers", peers);
    expect(peers.length).toBe(1);
  });
});
