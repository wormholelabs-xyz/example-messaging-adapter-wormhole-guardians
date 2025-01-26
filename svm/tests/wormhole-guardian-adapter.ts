import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { chainToChainId, encoding } from "@wormhole-foundation/sdk-base";
import {
  ChainAddress,
  serialize,
  UniversalAddress,
} from "@wormhole-foundation/sdk-definitions";
import * as testing from "@wormhole-foundation/sdk-definitions/testing";
import { assert, expect } from "chai";
import { ethers, keccak256 } from "ethers";
import { WormholeGuardianAdapter } from "../target/types/wormhole_guardian_adapter";
import endpointIDL from "./idl/endpoint.json";
import mockIntegratorIdl from "./idl/mock_integrator.json";
import WormholePostMessageShimIdl from "./idl/wormhole_post_message_shim.json";
import WormholeVerifyVaaShimIdl from "./idl/wormhole_verify_vaa_shim.json";
import { Endpoint } from "./types/endpoint";
import { MockIntegrator } from "./types/mock_integrator";
import { WormholePostMessageShim } from "./types/wormhole_post_message_shim";
import { WormholeVerifyVaaShim } from "./types/wormhole_verify_vaa_shim";

describe("wormhole-guardian-adapter", () => {
  // Constants
  const WORMHOLE_PROGRAM_ID = "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth";
  const ENDPOINT_PROGRAM_ID = "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
  const INTEGRATOR_PROGRAM_ID = "661Ly6gSCDiGWzC4tKJhS8tqXNWJU6yfbhxNKC4gPF5t";

  // Provider setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const guardianAdapter = anchor.workspace
    .WormholeGuardianAdapter as Program<WormholeGuardianAdapter>;
  const endpointProgram = new Program<Endpoint>(
    { ...(endpointIDL as Endpoint), address: ENDPOINT_PROGRAM_ID },
    provider
  );
  const postShimProgram = new Program<WormholePostMessageShim>(
    WormholePostMessageShimIdl as WormholePostMessageShim
  );
  const verifyShimProgram = new Program<WormholeVerifyVaaShim>(
    WormholeVerifyVaaShimIdl as WormholeVerifyVaaShim
  );
  const integratorProgram = new Program<MockIntegrator>(
    { ...mockIntegratorIdl, address: INTEGRATOR_PROGRAM_ID } as any,
    provider
  );

  const ethTransceiver: ChainAddress = {
    chain: "Ethereum",
    address: new UniversalAddress(
      encoding.bytes.encode("transceiver".padStart(32, "\0"))
    ),
  };
  const ethEmitter = new testing.mocks.MockEmitter(
    ethTransceiver.address as UniversalAddress,
    "Ethereum",
    0n
  );
  const ethChain = chainToChainId(ethTransceiver.chain);

  const ethTransceiver2: ChainAddress = {
    chain: "Ethereum",
    address: new UniversalAddress(
      encoding.bytes.encode("transceiver2".padStart(32, "\0"))
    ),
  };
  const ethEmitter2 = new testing.mocks.MockEmitter(
    ethTransceiver2.address as UniversalAddress,
    "Ethereum",
    0n
  );

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
      guardianAdapter.programId
    );
    return peerPDA;
  };

  const setPeer = async (
    chainId: number,
    contract: number[] | Uint8Array,
    signer: Keypair
  ) => {
    return guardianAdapter.methods
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
      guardianAdapter.programId
    );
  });

  const initialize = async (
    admin: PublicKey,
    wormholeProgram: PublicKey,
    consistencyLevel: { confirmed: {} } | { finalized: {} },
    signer: Keypair
  ) => {
    return guardianAdapter.methods
      .initialize({
        admin,
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
    return guardianAdapter.methods
      .transferAdmin({ newAdmin })
      .accounts({
        admin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const updateAdmin = async (newAdmin: PublicKey, signer: Keypair) => {
    return guardianAdapter.methods
      .updateAdmin({ newAdmin })
      .accounts({
        admin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const discardAdmin = async (signer: Keypair) => {
    return guardianAdapter.methods
      .discardAdmin()
      .accounts({
        admin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const claimAdmin = async (signer: Keypair) => {
    return guardianAdapter.methods
      .claimAdmin()
      .accounts({
        newAdmin: signer.publicKey,
      })
      .signers([signer])
      .rpc();
  };

  const verifyConfig = async (
    expectedAdmin: PublicKey | null,
    expectedPendingAdmin: PublicKey | null,
    expectedWormholeProgram?: PublicKey,
    expectedConsistencyLevel?: { confirmed: {} } | { finalized: {} }
  ) => {
    const config = await guardianAdapter.account.config.fetch(configPDA);
    if (expectedAdmin === null) {
      expect(config.admin).to.be.null;
    } else {
      expect(config.admin.toString()).to.equal(expectedAdmin.toString());
    }
    if (expectedPendingAdmin === null) {
      expect(config.pendingAdmin).to.be.null;
    } else {
      expect(config.pendingAdmin?.toString()).to.equal(
        expectedPendingAdmin.toString()
      );
    }

    if (expectedWormholeProgram) {
      expect(config.wormholeProgram.toString()).to.equal(
        expectedWormholeProgram.toString()
      );
    }
    if (expectedConsistencyLevel !== undefined) {
      expect(config.consistencyLevel).to.deep.equal(expectedConsistencyLevel);
    }
  };

  describe("initialization", () => {
    it("Initialize guardian adapter", async () => {
      const wormhole = new PublicKey(WORMHOLE_PROGRAM_ID);
      const consistencyLevel = { confirmed: {} };

      await initialize(payer.publicKey, wormhole, consistencyLevel, payer);

      await verifyConfig(payer.publicKey, null, wormhole, consistencyLevel);
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

      it("success path for claiming as new admin", async () => {
        await claimAdmin(newAdmin);
        await verifyConfig(newAdmin.publicKey, null);
      });

      it("success path for claim as admin", async () => {
        await transferAdmin(payer.publicKey, newAdmin);
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

        // Claim back admin
        await claimAdmin(payer);
      });
    });

    describe("setPeer", () => {
      it("success path", async () => {
        const peerChain = ethChain;
        const peerContract = ethTransceiver.address;
        const peerPDA = getPeerPDA(peerChain);

        await setPeer(peerChain, peerContract.toUint8Array(), payer);

        // Verify peer account state
        const peerAccount = await guardianAdapter.account.peer.fetch(peerPDA);
        expect(peerAccount.chain).to.equal(peerChain);
        expect(Buffer.from(peerAccount.contract)).to.deep.equal(
          peerContract.toUint8Array()
        );
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

    describe("discard admin", () => {
      it("fails if not admin", async () => {
        const newerAdmin = Keypair.generate();
        await expectTransactionToFail(
          discardAdmin(newerAdmin),
          "CallerNotAdmin"
        );
      });

      it("fails if transfer pending", async () => {
        // First create a pending transfer
        await transferAdmin(Keypair.generate().publicKey, payer);
        await expectTransactionToFail(
          discardAdmin(payer),
          "AdminTransferPending"
        );

        // Claim back
        await claimAdmin(payer);
      });

      it("success path", async () => {
        await discardAdmin(payer);
        await verifyConfig(null, null);
      });
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
    const chainBuffer = Buffer.alloc(chainId);
    chainBuffer.writeUInt16BE(chainId);

    const [integratorConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("integrator_config"),
        integratorProgram.programId.toBuffer(),
      ],
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
        chainBuffer,
      ],
      endpointProgram.programId
    );

    const [adapterInfo] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("adapter_info"),
        integratorProgram.programId.toBuffer(),
        guardianAdapter.programId.toBuffer(),
      ],
      endpointProgram.programId
    );

    return {
      integratorConfig,
      integratorProgramPda,
      sequenceTracker,
      eventAuthority,
      integratorChainConfig,
      adapterInfo,
    };
  };

  describe("messages", () => {
    let pdas: EndpointPDAs;
    let outboxMessage: Keypair;

    // Helper functions
    const setupIntegrator = async () => {
      await integratorProgram.methods
        .invokeRegister({ admin: payer.publicKey })
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
    };

    const setupAdapter = async (chainId: number) => {
      // Add adapter
      await endpointProgram.methods
        .addAdapter({
          integratorProgramId: integratorProgram.programId,
          adapterProgramId: guardianAdapter.programId,
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

      // Enable send adapter
      await endpointProgram.methods
        .enableSendAdapter({
          integratorProgramId: integratorProgram.programId,
          adapterProgramId: guardianAdapter.programId,
          chainId,
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
    };

    const sendTestMessage = async () => {
      await integratorProgram.methods
        .invokeSendMessage({
          dstChain: 2,
          dstAddr: Array(32).fill(0),
          payloadHash: Array(32).fill(0),
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
    };

    const createAndPostSignatures = async (
      expectedPayload: string,
      emitter: testing.mocks.MockEmitter
    ) => {
      const guardians = new testing.mocks.MockGuardians(0, [
        "cfb12303a19cde580bb4dd771639b0d26bc68353645571a8cff516ab2ee113a0",
      ]);

      const payloadBytes = Uint8Array.from(
        Buffer.from(expectedPayload.slice(2), "hex")
      );
      const published = emitter.publishMessage(0, payloadBytes, 200);
      const vaaBody = published.subarray(1 + 4 + 1);
      const rawVaa = guardians.addSignatures(published, [0]);

      const signatureKeypair = web3.Keypair.generate();

      try {
        const tx = await verifyShimProgram.methods
          .postSignatures(
            rawVaa.guardianSet,
            rawVaa.signatures.length,
            rawVaa.signatures.map((s) => [
              s.guardianIndex,
              ...s.signature.encode(),
            ])
          )
          .accounts({ guardianSignatures: signatureKeypair.publicKey })
          .signers([signatureKeypair])
          .rpc();
        return {
          signatureKey: signatureKeypair.publicKey,
          guardianSetIndex: rawVaa.guardianSet,
          vaaBody,
        };
      } catch (error) {
        console.error("Error posting VAA:", error);
        throw error;
      }
    };

    before(async () => {
      outboxMessage = Keypair.generate();
      pdas = deriveEndpointPDAs(ethChain);

      await setupIntegrator();
      await setupAdapter(ethChain);
      await sendTestMessage();
    });

    describe("send_message", () => {
      it("can pick up message", async () => {
        const [adapterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("adapter_pda")],
          guardianAdapter.programId
        );

        const outboxAccount = await guardianAdapter.account.outboxMessage.fetch(
          outboxMessage.publicKey
        );

        await guardianAdapter.methods
          .pickUpMessage()
          .accounts({
            outboxMessage: outboxMessage.publicKey,
            adapterInfo: pdas.adapterInfo,
            sequence: anchor.web3.PublicKey.findProgramAddressSync(
              [
                Buffer.from("Sequence"),
                anchor.web3.PublicKey.findProgramAddressSync(
                  [Buffer.from("emitter")],
                  guardianAdapter.programId
                )[0].toBuffer(),
              ],
              new anchor.web3.PublicKey(
                "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth"
              )
            )[0],
            wormholePostMessageShimEa:
              anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("__event_authority")],
                postShimProgram.programId
              )[0],
          })
          .accountsPartial({
            refundRecipient: payer.publicKey,
            adapterPda: adapterPda,
            eventAuthority: pdas.eventAuthority,
            endpointProgram: endpointProgram.programId,
          })
          .rpc();

        // Verification helpers
        const verifyWormholeMessage = async () => {
          const [wormholeMessage] = PublicKey.findProgramAddressSync(
            [Buffer.from("message"), outboxMessage.publicKey.toBuffer()],
            guardianAdapter.programId
          );
          const messageData = (
            await provider.connection.getAccountInfo(wormholeMessage)
          )?.data;

          if (messageData) {
            const expectedPayload = ethers.solidityPacked(
              ["bytes32", "uint64", "uint16", "bytes32", "bytes32"],
              [
                Buffer.from(outboxAccount.srcAddr),
                BigInt(outboxAccount.sequence.toString()),
                Number(outboxAccount.dstChain),
                Buffer.from(outboxAccount.dstAddr),
                Buffer.from(outboxAccount.payloadHash),
              ]
            );

            const payloadStart = 3 + (1 + 1 + 4 + 32 + 4 + 4 + 8 + 2 + 32) + 4;
            const actualPayload = messageData.slice(payloadStart);

            assert(
              Buffer.from(actualPayload).toString("hex") ===
                expectedPayload.slice(2),
              "Wormhole message payload should match expected payload"
            );
          }
        };

        await verifyWormholeMessage();

        const outboxMessageAccount =
          await endpointProgram.account.outboxMessage.fetchNullable(
            outboxMessage.publicKey
          );
        assert.isNull(
          outboxMessageAccount,
          "Outbox message account should be null"
        );
      });
    });

    describe("recv_message", () => {
      // Helper functions
      const deriveRecvMessagePDAs = (emitterChain: number = ethChain) => {
        const [configKey] = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          guardianAdapter.programId
        );
        const peerKey = getPeerPDA(emitterChain);
        const [adapterPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("adapter_pda")],
          guardianAdapter.programId
        );
        const [eventAuthority] = PublicKey.findProgramAddressSync(
          [Buffer.from("__event_authority")],
          endpointProgram.programId
        );

        const chainBuffer = Buffer.alloc(2);
        chainBuffer.writeUInt16BE(emitterChain);
        const [integratorChainConfigKey] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("integrator_chain_config"),
            integratorProgram.programId.toBuffer(),
            chainBuffer,
          ],
          endpointProgram.programId
        );

        return {
          configKey,
          peerKey,
          adapterPda,
          adapterInfo: pdas.adapterInfo,
          eventAuthority,
          integratorChainConfigKey,
        };
      };

      const deriveAttestationInfoKey = (
        wormholeMessage: any,
        emitterChain: number
      ) => {
        const packedData = ethers.solidityPacked(
          ["uint16", "bytes32", "uint64", "uint16", "bytes32", "bytes32"],
          [
            emitterChain,
            wormholeMessage.srcAddr.toUint8Array(),
            wormholeMessage.sequence,
            wormholeMessage.dstChain,
            wormholeMessage.dstAddr.toUint8Array(),
            wormholeMessage.payloadHash,
          ]
        );

        const [attestationInfoKey] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("attestation_info"),
            Buffer.from(ethers.getBytes(keccak256(packedData))),
          ],
          endpointProgram.programId
        );

        return attestationInfoKey;
      };

      const enableRecvAdapter = async (chainId: number) => {
        await endpointProgram.methods
          .enableRecvAdapter({
            integratorProgramId: integratorProgram.programId,
            adapterProgramId: guardianAdapter.programId,
            chainId,
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
      };

      const executeRecvMessage = async (
        wormholeMessage: any,
        signatureKey: PublicKey,
        guardianSetIndex: number,
        vaaBody: Uint8Array,
        emitterChain: number
      ) => {
        const pdas = deriveRecvMessagePDAs(emitterChain);
        const attestationInfoKey = deriveAttestationInfoKey(
          wormholeMessage,
          emitterChain
        );

        return guardianAdapter.methods
          .recvMessage({
            vaaBody: Buffer.from(vaaBody),
          })
          .accounts({
            payer: payer.publicKey,
            guardianSignatures: signatureKey,
            guardianSet: anchor.web3.PublicKey.findProgramAddressSync(
              [
                Buffer.from("GuardianSet"),
                (() => {
                  const buf = Buffer.alloc(4);
                  buf.writeUInt32BE(guardianSetIndex);
                  return buf;
                })(),
              ],
              new anchor.web3.PublicKey(
                "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth"
              )
            )[0],
          })
          .accountsPartial({
            config: pdas.configKey,
            peer: pdas.peerKey,
            adapterPda: pdas.adapterPda,
            adapterInfo: pdas.adapterInfo,
            integratorChainConfig: pdas.integratorChainConfigKey,
            attestationInfo: attestationInfoKey,
            eventAuthority: pdas.eventAuthority,
            endpointProgram: endpointProgram.programId,
          })
          .signers([payer]);
      };

      it("successfully attests valid VAA from registered peer", async () => {
        const emitterChain = ethChain;
        const wormholeMessage = {
          srcAddr: ethTransceiver.address,
          sequence: 0n,
          dstChain: 1,
          dstAddr: new UniversalAddress(integratorProgram.programId.toBytes()),
          payloadHash: Buffer.alloc(32),
        } as const;

        const expectedPayload = ethers.solidityPacked(
          ["bytes32", "uint64", "uint16", "bytes32", "bytes32"],
          [
            wormholeMessage.srcAddr.toUint8Array(),
            wormholeMessage.sequence,
            wormholeMessage.dstChain,
            wormholeMessage.dstAddr.toUint8Array(),
            wormholeMessage.payloadHash,
          ]
        );

        const { signatureKey, guardianSetIndex, vaaBody } =
          await createAndPostSignatures(expectedPayload, ethEmitter);
        await enableRecvAdapter(emitterChain);

        const attestationInfoKey = deriveAttestationInfoKey(
          wormholeMessage,
          emitterChain
        );
        const tx = await executeRecvMessage(
          wormholeMessage,
          signatureKey,
          guardianSetIndex,
          vaaBody,
          emitterChain
        );
        await tx.rpc();

        // Verify attestation info
        const attestationInfo =
          await endpointProgram.account.attestationInfo.fetch(
            attestationInfoKey
          );
        assert.equal(attestationInfo.srcChain, emitterChain);
        assert.deepEqual(
          attestationInfo.srcAddr,
          Array.from(ethTransceiver.address.toUint8Array())
        );
        assert.equal(attestationInfo.sequence.toNumber(), 0);
        assert.equal(attestationInfo.dstChain, wormholeMessage.dstChain);
        assert.deepEqual(
          attestationInfo.dstAddr,
          Array.from(wormholeMessage.dstAddr.toUint8Array())
        );
        assert.deepEqual(
          attestationInfo.payloadHash,
          Array.from(wormholeMessage.payloadHash)
        );
      });

      it("fails with invalid message size", async () => {
        const emitterChain = ethChain;
        // Create a message that would serialize to wrong size
        const wormholeMessage = {
          srcAddr: ethTransceiver.address,
          sequence: 0n,
          dstChain: 1,
          dstAddr: new UniversalAddress(Buffer.alloc(32)), // Wrong size address
          payloadHash: Buffer.alloc(32),
        } as const;

        const expectedPayload = ethers.solidityPacked(
          ["bytes32", "uint64", "uint16", "bytes32", "bytes32", "uint8"],
          [
            wormholeMessage.srcAddr.toUint8Array(),
            wormholeMessage.sequence,
            wormholeMessage.dstChain,
            wormholeMessage.dstAddr.toUint8Array(),
            wormholeMessage.payloadHash,
            0x00, // Extra byte added
          ]
        );

        const { signatureKey, guardianSetIndex, vaaBody } =
          await createAndPostSignatures(expectedPayload, ethEmitter);
        const tx = await executeRecvMessage(
          wormholeMessage,
          signatureKey,
          guardianSetIndex,
          vaaBody,
          emitterChain
        );
        await expectTransactionToFail(tx.rpc(), "InvalidPayloadLength");
      });

      it("fails with VAA from invalid peer", async () => {
        const emitterChain = ethChain;
        const wormholeMessage = {
          srcAddr: ethTransceiver2.address,
          sequence: 0n,
          dstChain: 1,
          dstAddr: new UniversalAddress(integratorProgram.programId.toBytes()),
          payloadHash: Buffer.alloc(32),
        } as const;

        const expectedPayload = ethers.solidityPacked(
          ["bytes32", "uint64", "uint16", "bytes32", "bytes32"],
          [
            wormholeMessage.srcAddr.toUint8Array(),
            wormholeMessage.sequence,
            wormholeMessage.dstChain,
            wormholeMessage.dstAddr.toUint8Array(),
            wormholeMessage.payloadHash,
          ]
        );

        const { signatureKey, guardianSetIndex, vaaBody } =
          await createAndPostSignatures(expectedPayload, ethEmitter2);
        const tx = await executeRecvMessage(
          wormholeMessage,
          signatureKey,
          guardianSetIndex,
          vaaBody,
          emitterChain
        );
        await expectTransactionToFail(tx.rpc(), "InvalidPeer");
      });

      it("fails with VAA from invalid chain", async () => {
        // Use baseTransceiver's chain for both VAA and PDA derivation
        const emitterChain = ethChain;
        const wormholeMessage = {
          srcAddr: ethTransceiver.address,
          sequence: 0n,
          dstChain: 3,
          dstAddr: new UniversalAddress(integratorProgram.programId.toBytes()),
          payloadHash: Buffer.alloc(32),
        } as const;

        const expectedPayload = ethers.solidityPacked(
          ["bytes32", "uint64", "uint16", "bytes32", "bytes32"],
          [
            wormholeMessage.srcAddr.toUint8Array(),
            wormholeMessage.sequence,
            wormholeMessage.dstChain,
            wormholeMessage.dstAddr.toUint8Array(),
            wormholeMessage.payloadHash,
          ]
        );

        const { signatureKey, guardianSetIndex, vaaBody } =
          await createAndPostSignatures(expectedPayload, ethEmitter);
        const tx = await executeRecvMessage(
          wormholeMessage,
          signatureKey,
          guardianSetIndex,
          vaaBody,
          emitterChain
        );
        await expectTransactionToFail(tx.rpc(), "InvalidChain");
      });
    });
  });
});
