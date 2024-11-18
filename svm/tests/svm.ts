import * as anchor from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { WormholeGuardianAdapter } from "../target/types/wormhole_guardian_adapter";

describe("wormhole-guardian-adapter", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace
    .WormholeGuardianAdapter as Program<WormholeGuardianAdapter>;

  // Test accounts
  let configPDA: PublicKey;
  let configBump: number;

  // Generate keypairs for testing
  const payer = Keypair.generate();
  const newAdmin = Keypair.generate();

  // Helper functions
  const getPeerPDA = (chainId: number): PublicKey => {
    const chainBuffer = Buffer.alloc(2);
    chainBuffer.writeUInt16BE(chainId);
    const [peerPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("peer"), chainBuffer],
      program.programId
    );
    return peerPDA;
  };

  const setPeer = async (
    chainId: number,
    contract: number[] | Uint8Array,
    signer: Keypair
  ) => {
    return program.methods
      .setPeer({
        peerChain: chainId,
        peerContract: [...contract],
      })
      .accounts({
        payer: signer.publicKey,
        admin: signer.publicKey,
      })
      .accountsPartial({
        peer: getPeerPDA(chainId),
      })
      .signers([signer])
      .rpc();
  };

  const expectTransactionToFail = async (
    promise: Promise<any>,
    expectedError: string
  ) => {
    try {
      await promise;
      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include(expectedError);
    }
  };

  before(async () => {
    // Airdrop some SOL to the payer
    const signature = await provider.connection.requestAirdrop(
      payer.publicKey,
      2 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Generate PDA for config
    [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  it("Initialize guardian adapter", async () => {
    // Mock values for initialization
    const mockEndpoint = web3.Keypair.generate().publicKey;
    const mockAdapter = web3.Keypair.generate().publicKey;
    const consistencyLevel = 1;

    const tx = await program.methods
      .initialize({
        admin: payer.publicKey,
        endpoint: mockEndpoint,
        wormholeProgram: mockAdapter,
        consistencyLevel: consistencyLevel,
      })
      .accounts({
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    const config = await program.account.config.fetch(configPDA);

    expect(config.admin.toString()).to.equal(payer.publicKey.toString());
    expect(config.pendingAdmin).to.be.null;
    expect(config.endpoint.toString()).to.equal(mockEndpoint.toString());
    expect(config.wormholeProgram.toString()).to.equal(mockAdapter.toString());
    expect(config.consistencyLevel).to.equal(consistencyLevel);
  });

  it("Transfer admin - fails if not admin", async () => {
    try {
      await program.methods
        .transferAdmin({
          newAdmin: newAdmin.publicKey,
        })
        .accounts({
          admin: newAdmin.publicKey,  // Not the admin
        })
        .signers([newAdmin])
        .rpc();

      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include("CallerNotAdmin");
    }
  });

  it("Transfer admin - success path", async () => {
    // Transfer admin
    await program.methods
      .transferAdmin({
        newAdmin: newAdmin.publicKey,
      })
      .accounts({
        admin: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Verify state after transfer
    const configAfter = await program.account.config.fetch(configPDA);
    expect(configAfter.admin.toString()).to.equal(payer.publicKey.toString());
    expect(configAfter.pendingAdmin?.toString()).to.equal(newAdmin.publicKey.toString());
  });


  it("Transfer admin - fails if transfer already pending", async () => {
    // Second transfer should fail
    try {
      await program.methods
        .transferAdmin({
          newAdmin: Keypair.generate().publicKey,
        })
        .accounts({
          admin: payer.publicKey,
        })
        .signers([payer])
        .rpc();

      assert.fail("Expected the transaction to fail with AdminTransferPending");
    } catch (error: any) {
      expect(error.error.errorCode.code).to.equal("AdminTransferPending");
    }

    // Verify state didn't change
    const configFinal = await program.account.config.fetch(configPDA);
    expect(configFinal.pendingAdmin?.toString()).to.equal(newAdmin.publicKey.toString());
  });


  it("Update admin - fails if transfer pending", async () => {
    // Try to update while transfer is pending
    const newerAdmin = Keypair.generate();
    try {
      await program.methods
        .updateAdmin({
          newAdmin: newerAdmin.publicKey,
        })
        .accounts({
          admin: payer.publicKey,
        })
        .signers([payer])
        .rpc();

      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include("AdminTransferPending");
    }
  });

  it("Claim admin - fails if wrong pending admin", async () => {
    // Try to claim with wrong account
    const wrongClaimer = Keypair.generate();
    try {
      await program.methods
        .claimAdmin()
        .accounts({
          newAdmin: wrongClaimer.publicKey,
        })
        .signers([wrongClaimer])
        .rpc();

      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include("CallerNotAdmin");
    }
  });

  it("Claim admin - success path", async () => {
    // Claim admin
    await program.methods
      .claimAdmin()
      .accounts({
        newAdmin: newAdmin.publicKey,
      })
      .signers([newAdmin])
      .rpc();

    // Verify state after claim
    const configAfter = await program.account.config.fetch(configPDA);
    expect(configAfter.admin.toString()).to.equal(newAdmin.publicKey.toString());
    expect(configAfter.pendingAdmin).to.be.null;
  });

  it("Claim admin - fails if no transfer pending", async () => {
    try {
      await program.methods
        .claimAdmin()
        .accounts({
          newAdmin: newAdmin.publicKey,
        })
        .signers([newAdmin])
        .rpc();

      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include("NoAdminUpdatePending");
    }
  });

  it("Update admin - fails if not admin", async () => {
    const newerAdmin = Keypair.generate();

    try {
      await program.methods
        .updateAdmin({
          newAdmin: newerAdmin.publicKey,
        })
        .accounts({
          admin: payer.publicKey,  // Not the admin
        })
        .signers([payer])
        .rpc();

      assert.fail("Expected transaction to fail");
    } catch (error) {
      expect(error.message).to.include("CallerNotAdmin");
    }
  });

  it("Update admin directly - success path", async () => {

    await program.methods
      .updateAdmin({
        newAdmin: payer.publicKey,
      })
      .accounts({
        admin: newAdmin.publicKey,
      })
      .signers([newAdmin])
      .rpc();

    const configAfter = await program.account.config.fetch(configPDA);
    expect(configAfter.admin.toString()).to.equal(payer.publicKey.toString());
    expect(configAfter.pendingAdmin).to.be.null;
  });

  describe("setPeer", () => {
    it("success path", async () => {
      const peerChain = 2;
      const peerContract = web3.Keypair.generate().publicKey;
      const peerPDA = getPeerPDA(peerChain);

      await setPeer(peerChain, peerContract.toBytes(), payer);

      // Verify peer account state
      const peerAccount = await program.account.peer.fetch(peerPDA);
      expect(peerAccount.chain).to.equal(peerChain);
      expect(Buffer.from(peerAccount.contract)).to.deep.equal(peerContract.toBytes());
    });

    it("fails if already set", async () => {
      const peerChain = 2;
      const newContract = web3.Keypair.generate().publicKey;

      await expectTransactionToFail(
        setPeer(peerChain, newContract.toBytes(), payer),
        "PeerAlreadySet"
      );
    });

    it("fails with zero chain ID", async () => {
      const peerContract = web3.Keypair.generate().publicKey;

      await expectTransactionToFail(
        setPeer(0, peerContract.toBytes(), payer),
        "InvalidChain"
      );
    });

    it("fails with zero address contract", async () => {
      const peerChain = 3;
      const zeroContract = new Array(32).fill(0);

      await expectTransactionToFail(
        setPeer(peerChain, zeroContract, payer),
        "InvalidPeerZeroAddress"
      );
    });

    it("fails if not admin", async () => {
      const peerChain = 4;
      const peerContract = web3.Keypair.generate().publicKey;
      const notAdmin = web3.Keypair.generate();

      // Airdrop some SOL to the not-admin account
      const signature = await provider.connection.requestAirdrop(
        notAdmin.publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);

      await expectTransactionToFail(
        setPeer(peerChain, peerContract.toBytes(), notAdmin),
        "CallerNotAdmin"
      );
    });
  });
});

