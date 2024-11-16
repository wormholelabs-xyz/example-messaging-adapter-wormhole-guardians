import * as anchor from "@coral-xyz/anchor";
import { assert, expect, use } from "chai";
import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { WormholeGuardianAdapter } from "../target/types/wormhole_guardian_adapter";

describe("wormhole-guardian-adapter", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace
    .WormholeGuardianAdapter as Program<WormholeGuardianAdapter>;

  // Test accounts
  let configPDA: PublicKey;
  let configBump: number;

  // Generate a new keypair for the payer
  const payer = Keypair.generate();

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
    expect(config.consistencyLevel).to.equal(consistencyLevel)
  });
});
