import * as anchor from "@coral-xyz/anchor";
import { assert, expect } from "chai";
import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import endpointIDL from "../lib/example-messaging-endpoint/svm/target/idl/endpoint.json";
import { Endpoint } from "../lib/example-messaging-endpoint/svm/target/types/endpoint";
import mockIntegratorIdl from "../lib/example-messaging-endpoint/svm/target/idl/mock_integrator.json";
import { MockIntegrator } from "../lib/example-messaging-endpoint/svm/target/types/mock_integrator";
import { WormholeGuardianAdapter } from "../target/types/wormhole_guardian_adapter";

describe("wormhole-guardian-adapter", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace
    .WormholeGuardianAdapter as Program<WormholeGuardianAdapter>;
  console.log("WormholeGuardianAdapter Program ID:", program.programId.toString());

  const endpointProgram = new Program<Endpoint>(
    { ...endpointIDL as Endpoint, address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD" },
    provider
  );
  console.log("Endpoint Program ID:", endpointProgram.programId.toString());

  const integratorProgram = new Program<MockIntegrator>(
    { ...mockIntegratorIdl, address: "661Ly6gSCDiGWzC4tKJhS8tqXNWJU6yfbhxNKC4gPF5t" } as any,
    provider
  );
  console.log("MockIntegrator Program ID:", integratorProgram.programId.toString());

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

  const initialize = async (
    admin: PublicKey,
    endpoint: PublicKey,
    wormholeProgram: PublicKey,
    consistencyLevel: number,
    signer: Keypair
  ) => {
    return program.methods
      .initialize({
        admin,
        endpoint,
        wormholeProgram,
        consistencyLevel,
      })
      .accounts({
        payer: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const transferAdmin = async (newAdmin: PublicKey, signer: Keypair) => {
    return program.methods
      .transferAdmin({ newAdmin })
      .accounts({
        admin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const updateAdmin = async (newAdmin: PublicKey, signer: Keypair) => {
    return program.methods
      .updateAdmin({ newAdmin })
      .accounts({
        admin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const claimAdmin = async (signer: Keypair) => {
    return program.methods
      .claimAdmin()
      .accounts({
        newAdmin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const verifyConfig = async (
    expectedAdmin: PublicKey,
    expectedPendingAdmin: PublicKey | null,
    expectedEndpoint?: PublicKey,
    expectedWormholeProgram?: PublicKey,
    expectedConsistencyLevel?: number
  ) => {
    const config = await program.account.config.fetch(configPDA);
    expect(config.admin.toString()).to.equal(expectedAdmin.toString());

    if (expectedPendingAdmin === null) {
      expect(config.pendingAdmin).to.be.null;
    } else {
      expect(config.pendingAdmin?.toString()).to.equal(expectedPendingAdmin.toString());
    }

    if (expectedEndpoint) {
      expect(config.endpoint.toString()).to.equal(expectedEndpoint.toString());
    }
    if (expectedWormholeProgram) {
      expect(config.wormholeProgram.toString()).to.equal(expectedWormholeProgram.toString());
    }
    if (expectedConsistencyLevel !== undefined) {
      expect(config.consistencyLevel).to.equal(expectedConsistencyLevel);
    }
  };

  describe("initialization", () => {
    it("Initialize guardian adapter", async () => {
      const mockEndpoint = web3.Keypair.generate().publicKey;
      const mockAdapter = web3.Keypair.generate().publicKey;
      const consistencyLevel = 1;

      await initialize(
        payer.publicKey,
        mockEndpoint,
        mockAdapter,
        consistencyLevel,
        payer
      );

      await verifyConfig(
        payer.publicKey,
        null,
        mockEndpoint,
        mockAdapter,
        consistencyLevel
      );
    });
  });

  describe("admin management", () => {
    describe("transfer admin", () => {
      it("fails if not admin", async () => {
        await expectTransactionToFail(
          transferAdmin(newAdmin.publicKey, newAdmin),
          "CallerNotAdmin"
        );
      });

      it("success path", async () => {
        await transferAdmin(newAdmin.publicKey, payer);
        await verifyConfig(payer.publicKey, newAdmin.publicKey);
      });

      it("fails if transfer already pending", async () => {
        const anotherAdmin = Keypair.generate();
        await expectTransactionToFail(
          transferAdmin(anotherAdmin.publicKey, payer),
          "AdminTransferPending"
        );
        await verifyConfig(payer.publicKey, newAdmin.publicKey);
      });
    });

    describe("claim admin", () => {
      it("fails if wrong pending admin", async () => {
        const wrongClaimer = Keypair.generate();
        await expectTransactionToFail(
          claimAdmin(wrongClaimer),
          "CallerNotAdmin"
        );
      });

      it("success path", async () => {
        await claimAdmin(newAdmin);
        await verifyConfig(newAdmin.publicKey, null);
      });

      it("fails if no transfer pending", async () => {
        await expectTransactionToFail(
          claimAdmin(newAdmin),
          "NoAdminUpdatePending"
        );
      });
    });

    describe("update admin", () => {
      it("fails if not admin", async () => {
        const newerAdmin = Keypair.generate();
        await expectTransactionToFail(
          updateAdmin(newerAdmin.publicKey, payer),
          "CallerNotAdmin"
        );
      });

      it("success path", async () => {
        await updateAdmin(payer.publicKey, newAdmin);
        await verifyConfig(payer.publicKey, null);
      });

      it("fails if transfer pending", async () => {
        // First create a pending transfer
        await transferAdmin(Keypair.generate().publicKey, payer);

        const newerAdmin = Keypair.generate();
        await expectTransactionToFail(
          updateAdmin(newerAdmin.publicKey, newAdmin),
          "AdminTransferPending"
        );
      });
    });
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
      const peerContract = Keypair.generate().publicKey;
      const notAdmin = Keypair.generate();

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

  interface EndpointPDAs {
    integratorConfig: PublicKey;
    integratorProgramPda: PublicKey;
    sequenceTracker: PublicKey;
    eventAuthority: PublicKey;
    integratorChainConfig: PublicKey;
    adapterInfo: PublicKey;
  }

  const deriveEndpointPDAs = (chainId: number): EndpointPDAs => {
    const chainBuffer = Buffer.alloc(2);
    chainBuffer.writeUInt16BE(chainId);

    const [integratorConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("integrator_config"), integratorProgram.programId.toBuffer()],
      endpointProgram.programId
    );

    const [integratorProgramPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("endpoint_integrator")],
      integratorProgram.programId
    );

    const [sequenceTracker] = PublicKey.findProgramAddressSync(
      [Buffer.from("sequence_tracker"), integratorProgram.programId.toBuffer()],
      endpointProgram.programId
    );

    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      endpointProgram.programId
    );

    const [integratorChainConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("integrator_chain_config"),
        integratorProgram.programId.toBuffer(),
        chainBuffer
      ],
      endpointProgram.programId
    );

    const [adapterInfo] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("adapter_info"),
        integratorProgram.programId.toBuffer(),
        program.programId.toBuffer(),
      ],
      endpointProgram.programId
    );

    return {
      integratorConfig,
      integratorProgramPda,
      sequenceTracker,
      eventAuthority,
      integratorChainConfig,
      adapterInfo
    };
  };

  describe("messages", () => {
    let pdas: EndpointPDAs;
    let outboxMessage: Keypair;

    before(async () => {
      // Setup accounts
      outboxMessage = Keypair.generate();
      pdas = deriveEndpointPDAs(2); // chainId 2

      // Airdrop
      await provider.connection.requestAirdrop(
        payer.publicKey,
        5 * web3.LAMPORTS_PER_SOL
      );

      // Setup integrator
      await integratorProgram.methods
        .invokeRegister({
          admin: payer.publicKey,
        })
        .accounts({
          payer: payer.publicKey,
          integratorConfig: pdas.integratorConfig,
          sequenceTracker: pdas.sequenceTracker,
          program: endpointProgram.programId,
        })
        .accountsPartial({
          integratorProgramPda: pdas.integratorProgramPda,
          eventAuthority: pdas.eventAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
          endpointProgram: endpointProgram.programId,
        })
        .signers([payer])
        .rpc();

      // Setup adapter
      await endpointProgram.methods
        .addAdapter({
          integratorProgramId: integratorProgram.programId,
          adapterProgramId: program.programId,
        })
        .accounts({
          payer: payer.publicKey,
          admin: payer.publicKey,
        })
        .accountsPartial({
          integratorConfig: pdas.integratorConfig,
          adapterInfo: pdas.adapterInfo,
        })
        .signers([payer])
        .rpc();

      await endpointProgram.methods
        .enableSendAdapter({
          integratorProgramId: integratorProgram.programId,
          adapterProgramId: program.programId,
          chainId: 2,
        })
        .accounts({
          payer: payer.publicKey,
          admin: payer.publicKey,
        })
        .accountsPartial({
          integratorConfig: pdas.integratorConfig,
          adapterInfo: pdas.adapterInfo,
          integratorChainConfig: pdas.integratorChainConfig,
        })
        .signers([payer])
        .rpc();

      const dstAddr = Array(32).fill(0);
      const payloadHash = Array(32).fill(0);

      await integratorProgram.methods
        .invokeSendMessage({
          dstChain: 2,
          dstAddr: { bytes: dstAddr },
          payloadHash
        })
        .accounts({
          payer: payer.publicKey,
          outboxMessage: outboxMessage.publicKey,
          sequenceTracker: pdas.sequenceTracker,
          program: endpointProgram.programId,
          integratorChainConfig: pdas.integratorChainConfig,
        })
        .accountsPartial({
          integratorProgramPda: pdas.integratorProgramPda,
          endpointProgram: endpointProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          eventAuthority: pdas.eventAuthority,
        })
        .signers([payer, outboxMessage])
        .rpc();
    });

    // All the other tests are done in Endpoint repo since the logic
    // is handled by Endpoint
    it("can pick up message", async () => {
      // Get the adapter PDA
      const [adapterPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("adapter_pda")],
        program.programId
      );

      // Execute pick_up_message
      await program.methods
        .pickUpMessage()
        .accounts({
          outboxMessage: outboxMessage.publicKey,
          adapterInfo: pdas.adapterInfo,
          refundRecipient: payer.publicKey,
        })
        .accountsPartial({
          adapterPda: adapterPda,
          eventAuthority: pdas.eventAuthority,
          endpointProgram: endpointProgram.programId,
        })
        .rpc();

      const outboxMessageAccount = await endpointProgram.account.outboxMessage.fetchNullable(outboxMessage.publicKey);
      assert.isNull(outboxMessageAccount, "Outbox message account should be null");
    });
  });
});

