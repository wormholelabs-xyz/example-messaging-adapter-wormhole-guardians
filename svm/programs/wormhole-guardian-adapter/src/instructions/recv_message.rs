declare_program!(endpoint);
declare_program!(wormhole_verify_vaa_shim);

use anchor_lang::{
    prelude::*,
    solana_program::{self, keccak},
};

use endpoint::{program::Endpoint, types::AttestMessageArgs};
use wormhole_raw_vaas::Body;
use wormhole_verify_vaa_shim::cpi::accounts::VerifyVaa;
use wormhole_verify_vaa_shim::program::WormholeVerifyVaaShim;

use crate::{
    error::WormholeGuardiansAdapterError,
    state::{Config, Message, Peer},
    CHAIN_ID,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ReceiveMessageArgs {
    pub vaa_body: Vec<u8>,
}

#[derive(Accounts)]
#[instruction(args: ReceiveMessageArgs)]
pub struct ReceiveMessage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [Config::SEED_PREFIX],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    // SPEC: Message must come from registered peer
    #[account(
        seeds = [Peer::SEED_PREFIX, args.vaa_body[8..10].as_ref()],
        constraint = peer.contract == args.vaa_body[10..42] @ WormholeGuardiansAdapterError::InvalidPeer,
        bump = peer.bump,
    )]
    pub peer: Account<'info, Peer>,

    /// CHECK: Guardian set used for signature verification by shim.
    /// Derivation is checked by the shim.
    guardian_set: UncheckedAccount<'info>,

    /// CHECK: Stored guardian signatures to be verified by shim.
    /// Ownership ownership and discriminator is checked by the shim.
    guardian_signatures: UncheckedAccount<'info>,

    wormhole_verify_vaa_shim: Program<'info, WormholeVerifyVaaShim>,

    /// The adapter info account
    /// CHECK: This account is checked by the endpoint program
    pub adapter_info: UncheckedAccount<'info>,

    /// The adapter PDA account, used for signing the CPI invocation
    #[account(
        seeds = [b"adapter_pda"],
        bump,
    )]
    pub adapter_pda: SystemAccount<'info>,

    /// The integrator chain config account
    /// CHECK: This account is checked by the endpoint program
    pub integrator_chain_config: UncheckedAccount<'info>,

    /// The attestation info account
    /// CHECK: This account is checked by the endpoint program
    #[account(mut)]
    pub attestation_info: UncheckedAccount<'info>,

    /// The event authority PDA for Endpoint to call `emit_cpi`
    /// CHECK: This should be seeded with `__event_authority`
    #[account(
        seeds = [b"__event_authority"],
        bump,
        seeds::program = endpoint::ID,
    )]
    pub event_authority: AccountInfo<'info>,

    /// The endpoint program
    pub endpoint_program: Program<'info, Endpoint>,

    pub system_program: Program<'info, System>,
}

/// Receives and verifies a Wormhole VAA message, then attests it to the endpoint program.
///
/// This function performs the following steps:
/// 1. Verifies the VAA comes from a registered peer contract
/// 2. Validates the message is targeted to this chain
/// 3. Extracts message data from the VAA
/// 4. Attests the message to the endpoint program via CPI
///
/// # Arguments
///
/// * `ctx` - The context of the instruction, containing:
///   * `payer`: Account paying for transaction fees
///   * `config`: Program config account
///   * `peer`: The registered peer account for the source chain
///   * `vaa`: The verified Wormhole VAA containing the message
///   * `wormhole_program`: The Wormhole program
///   * `adapter_info`: The adapter's info account on endpoint
///   * `adapter_pda`: The adapter's PDA for signing
///   * `integrator_chain_config`: The integrator's chain config
///   * `attestation_info`: Account to store attestation information
///   * `event_authority`: The endpoint's event authority PDA
///   * `endpoint_program`: The endpoint program
/// * `args` - The arguments containing:
///   * `vaa_hash`: The hash of the VAA being processed
///
/// # Errors
///
/// This function will return an error if:
/// * VAA is not from a registered peer (InvalidPeer)
/// * Message is not targeted to this chain (InvalidChain)
/// * Message format is invalid (checked in VAA decoding)
///
/// # Events
///
/// * The endpoint CPI emits a `MessageAttested` event
pub fn recv_message(ctx: Context<ReceiveMessage>, args: ReceiveMessageArgs) -> Result<()> {
    // Compute the message hash.
    let message_hash = &solana_program::keccak::hashv(&[&args.vaa_body]).to_bytes();
    let digest = keccak::hash(message_hash.as_slice()).to_bytes();
    // Verify the hash against the signatures.
    wormhole_verify_vaa_shim::cpi::verify_vaa(
        CpiContext::new(
            ctx.accounts.wormhole_verify_vaa_shim.to_account_info(),
            VerifyVaa {
                guardian_set: ctx.accounts.guardian_set.to_account_info(),
                guardian_signatures: ctx.accounts.guardian_signatures.to_account_info(),
            },
        ),
        digest,
    )?;
    // Decode vaa_body
    let body: Body = args
        .vaa_body
        .as_slice()
        .try_into()
        .map_err(|_| WormholeGuardiansAdapterError::InvalidPayloadLength)?;
    let payload = body.payload();
    let message: Message = payload
        .as_ref()
        .try_into()
        .map_err(|_| WormholeGuardiansAdapterError::InvalidPayloadLength)?;
    // Perform additional security checks
    require!(
        message.dst_chain() == CHAIN_ID,
        WormholeGuardiansAdapterError::InvalidChain
    );

    // Prepare the seeds for PDA signing
    let bump_seed = &[ctx.bumps.adapter_pda][..];
    let signer_seeds: &[&[&[u8]]] = &[&[b"adapter_pda", bump_seed]];

    // SPEC: Must attest message to endpoint
    endpoint::cpi::attest_message(
        ctx.accounts
            .invoke_attest_message()
            .with_signer(signer_seeds),
        AttestMessageArgs {
            adapter_program_id: crate::id(),
            adapter_pda_bump: ctx.bumps.adapter_pda,
            src_chain: body.emitter_chain(),
            src_addr: message.src_addr(),
            sequence: message.sequence(),
            dst_chain: message.dst_chain(),
            integrator_program_id: Pubkey::new_from_array(message.dst_addr()),
            payload_hash: message.payload_hash(),
        },
    )?;

    // We are not emitting here since the CPI call already emits MessageAttested
    Ok(())
}

impl<'info> ReceiveMessage<'info> {
    /// Helper function to create the CpiContext for the attest_message instruction
    pub fn invoke_attest_message(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, endpoint::cpi::accounts::AttestMessage<'info>> {
        let cpi_program = self.endpoint_program.to_account_info();
        let cpi_accounts = endpoint::cpi::accounts::AttestMessage {
            payer: self.payer.to_account_info(),
            adapter_info: self.adapter_info.to_account_info(),
            adapter_pda: self.adapter_pda.to_account_info(),
            integrator_chain_config: self.integrator_chain_config.to_account_info(),
            attestation_info: self.attestation_info.to_account_info(),
            event_authority: self.event_authority.to_account_info(),
            program: self.endpoint_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
