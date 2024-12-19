import { jest, expect, test } from "@jest/globals";
import { ethers } from "ethers";
import {
  claimAdmin,
  getAdmin,
  getPendingAdmin,
  transferAdmin,
} from "../src/admin";

jest.setTimeout(180000);

const fakeIntegrator = "0x1B5Ba8B47e656Afe522634ca7F058b2BE33075Af";
const nullAdmin = "0x0000000000000000000000000000000000000000";

const anvilPrivateKey =
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const anvilEthProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const anvilEthSigner = new ethers.Wallet(anvilPrivateKey, anvilEthProvider);
const whGuardiansAdapter = "0x8564C314028B778C968E11485E4bD6aC13CF0eeF";

describe("TS as Admin Tests", () => {
  // Can only be run once per Anvil deployment.

  describe("cancel transfer", () => {
    test("getAdmin, getPendingAdmin, transferAdmin, claimAdmin", async () => {
      const firstNonce = await anvilEthProvider.getTransactionCount(
        anvilEthSigner.address,
      );
      console.log("Nonce before transferAdmin:", firstNonce);

      await transferAdmin(whGuardiansAdapter, anvilEthSigner, fakeIntegrator);

      let admin = await getAdmin(whGuardiansAdapter, anvilEthSigner);
      let pendingAdmin = await getPendingAdmin(
        whGuardiansAdapter,
        anvilEthSigner,
      );
      expect(admin).toBe(anvilEthSigner.address);
      expect(pendingAdmin).toBe(fakeIntegrator);

      await claimAdmin(whGuardiansAdapter, anvilEthSigner);

      admin = await getAdmin(whGuardiansAdapter, anvilEthSigner);
      pendingAdmin = await getPendingAdmin(whGuardiansAdapter, anvilEthSigner);
      expect(admin).toBe(anvilEthSigner.address);
      expect(pendingAdmin).toBe(nullAdmin);
    });
  });
});
