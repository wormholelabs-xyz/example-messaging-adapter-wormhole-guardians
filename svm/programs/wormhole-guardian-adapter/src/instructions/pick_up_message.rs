declare_program!(endpoint);
declare_program!(wormhole_post_message_shim);

use crate::state::{Config, Finality};
use anchor_lang::prelude::*;

use endpoint::{accounts::OutboxMessage, program::Endpoint, types::PickUpMessageArgs};
use wormhole_anchor_sdk::wormhole::BridgeData;
use wormhole_post_message_shim::program::WormholePostMessageShim;
use wormhole_solana_consts::{
    CORE_BRIDGE_CONFIG, CORE_BRIDGE_FEE_COLLECTOR, CORE_BRIDGE_PROGRAM_ID,
};

impl From<Finality> for wormhole_post_message_shim::types::Finality {
    fn from(value: Finality) -> Self {
        match value {
            Finality::Confirmed => Self::Confirmed,
            Finality::Finalized => Self::Finalized,
        }
    }
}

/// Accounts struct for the pick_up_message instruction
#[derive(Accounts)]
pub struct PickUpMessage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [Config::SEED_PREFIX],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// The outbox message account to be picked up
    /// This account is mutable so we can update the `outstanding_adapters` state
    /// CHECK: the constraint checks like `refund_recipient` is done by the Endpoint program
    #[account(mut)]
    pub outbox_message: Account<'info, OutboxMessage>,

    /// The adapter info account
    /// CHECK: This account is checked by the endpoint program
    pub adapter_info: UncheckedAccount<'info>,

    /// The adapter PDA account, used for signing the CPI invocation
    #[account(
        seeds = [b"adapter_pda"],
        bump,
    )]
    pub adapter_pda: SystemAccount<'info>,

    /// The event authority PDA for Endpoint to call `emit_cpi`
    /// CHECK: This should be seeded with `__event_authority`
    #[account(
		seeds = [b"__event_authority"],
		bump,
		seeds::program = endpoint::ID,
	)]
    pub event_authority: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: this is a refund recipient that will be passed in by integrator
    pub refund_recipient: AccountInfo<'info>,

    /// The endpoint program
    pub endpoint_program: Program<'info, Endpoint>,

    wormhole_post_message_shim: Program<'info, WormholePostMessageShim>,

    #[account(mut, address = CORE_BRIDGE_CONFIG)]
    /// CHECK: Wormhole bridge config. [`wormhole::post_message`] requires this account be mutable.
    /// Address constraint added for IDL generation / convenience, it will be enforced by the core bridge.
    pub bridge: Account<'info, BridgeData>,

    #[account(mut, seeds = [&emitter.key.to_bytes()], bump, seeds::program = wormhole_post_message_shim::ID)]
    /// CHECK: Wormhole Message. [`wormhole::post_message`] requires this account be signer and mutable.
    /// Seeds constraint added for IDL generation / convenience, it will be enforced by the shim.
    pub message: UncheckedAccount<'info>,

    #[account(seeds = [b"emitter"], bump)]
    /// CHECK: Our emitter
    /// Seeds constraint added for IDL generation / convenience, it will be enforced to match the signer used in the CPI call.
    pub emitter: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: Emitter's sequence account. [`wormhole::post_message`] requires this account be mutable.
    /// Explicitly do not re-derive this account. The core bridge verifies the derivation anyway and
    /// as of Anchor 0.30.1, auto-derivation for other programs' accounts via IDL doesn't work.
    pub sequence: UncheckedAccount<'info>,

    #[account(mut, address = CORE_BRIDGE_FEE_COLLECTOR)]
    /// CHECK: Wormhole fee collector. [`wormhole::post_message`] requires this account be mutable.
    /// Address constraint added for IDL generation / convenience, it will be enforced by the core bridge.
    pub fee_collector: UncheckedAccount<'info>,

    /// Clock sysvar.
    /// Type added for IDL generation / convenience, it will be enforced by the core bridge.
    pub clock: Sysvar<'info, Clock>,

    /// System program.
    /// Type for IDL generation / convenience, it will be enforced by the core bridge.
    pub system_program: Program<'info, System>,

    /// Rent sysvar.
    /// Type added for IDL generation / convenience, it will be enforced by the core bridge.
    pub rent: Sysvar<'info, Rent>,

    #[account(address = CORE_BRIDGE_PROGRAM_ID)]
    /// CHECK: Wormhole program.
    /// Address constraint added for IDL generation / convenience, it will be enforced by the shim.
    pub wormhole_program: UncheckedAccount<'info>,

    /// CHECK: Shim event authority
    /// TODO: An address constraint could be included if this address was published to wormhole_solana_consts
    /// Address will be enforced by the shim.
    pub wormhole_post_message_shim_ea: UncheckedAccount<'info>,
}

impl<'info> PickUpMessage<'info> {
    /// Helper function to create the CpiContext for the pick_up_message instruction
    pub fn pick_up_message_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, endpoint::cpi::accounts::PickUpMessage<'info>> {
        let cpi_program = self.endpoint_program.to_account_info();
        let cpi_accounts = endpoint::cpi::accounts::PickUpMessage {
            outbox_message: self.outbox_message.to_account_info(),
            adapter_info: self.adapter_info.to_account_info(),
            adapter_pda: self.adapter_pda.to_account_info(),
            event_authority: self.event_authority.to_account_info(),
            program: self.endpoint_program.to_account_info(),
            refund_recipient: self.refund_recipient.to_account_info(),
            system_program: self.system_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

/// Picks up a message from the endpoint outbox and posts it to Wormhole.
///
/// This function performs the following steps:
/// 1. Makes a CPI call to endpoint program to pick up the message
/// 2. Creates a GuardianMessage from the outbox message data
/// 3. Posts the message to Wormhole using the program's emitter PDA
///
/// # Arguments
///
/// * `ctx` - The context of the instruction, containing:
///   * `payer`: Account paying for transaction fees
///   * `outbox_message`: The endpoint outbox message to be picked up
///   * `adapter_info`: The adapter's info account on endpoint
///   * `adapter_pda`: The adapter's PDA for signing
///   * `event_authority`: The endpoint's event authority PDA
///   * `refund_recipient`: Account to receive any refunds
///   * `wormhole_message`: PDA to store the Wormhole message
///   * `emitter`: The program's Wormhole emitter PDA
///   * `wormhole`: Required Wormhole program accounts
///
/// # Events
///
/// * The endpoint CPI emits a `MessagePickedUp` event
/// * Creates a Wormhole message posting
pub fn pick_up_message(ctx: Context<PickUpMessage>) -> Result<()> {
    // Prepare the seeds for PDA signing
    let bump_seed = &[ctx.bumps.adapter_pda][..];
    let signer_seeds: &[&[&[u8]]] = &[&[b"adapter_pda", bump_seed]];

    // Perform the CPI call to the endpoint program's pick_up_message instruction
    // This will update the outstanding adapters in the outbox on the Endpoint program
    endpoint::cpi::pick_up_message(
        ctx.accounts
            .pick_up_message_context()
            .with_signer(signer_seeds),
        PickUpMessageArgs {
            adapter_program_id: crate::id(),
            adapter_pda_bump: ctx.bumps.adapter_pda,
        },
    )?;

    // SPEC: Must create and post Wormhole message with outbox message data
    let message = {
        // Match EVM encoding: abi.encodePacked(srcAddr, sequence, dstChain, dstAddr, payloadHash)
        let mut bytes = Vec::with_capacity(106); // 32 + 8 + 2 + 32 + 32
        bytes.extend_from_slice(&ctx.accounts.outbox_message.src_addr);
        bytes.extend_from_slice(&ctx.accounts.outbox_message.sequence.to_be_bytes());
        bytes.extend_from_slice(&ctx.accounts.outbox_message.dst_chain.to_be_bytes());
        bytes.extend_from_slice(&ctx.accounts.outbox_message.dst_addr);
        bytes.extend_from_slice(&ctx.accounts.outbox_message.payload_hash);
        bytes
    };

    if ctx.accounts.bridge.fee() > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.fee_collector.to_account_info(),
                },
            ),
            ctx.accounts.bridge.fee(),
        )?;
    }

    wormhole_post_message_shim::cpi::post_message(
        CpiContext::new_with_signer(
            ctx.accounts.wormhole_post_message_shim.to_account_info(),
            wormhole_post_message_shim::cpi::accounts::PostMessage {
                payer: ctx.accounts.payer.to_account_info(),
                bridge: ctx.accounts.bridge.to_account_info(),
                message: ctx.accounts.message.to_account_info(),
                emitter: ctx.accounts.emitter.to_account_info(),
                sequence: ctx.accounts.sequence.to_account_info(),
                fee_collector: ctx.accounts.fee_collector.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                wormhole_program: ctx.accounts.wormhole_program.to_account_info(),
                program: ctx.accounts.wormhole_post_message_shim.to_account_info(),
                event_authority: ctx.accounts.wormhole_post_message_shim_ea.to_account_info(),
            },
            &[&[b"emitter", &[ctx.bumps.emitter]]],
        ),
        0,
        ctx.accounts.config.consistency_level.into(),
        message,
    )?;

    // We are not emitting here since the CPI call already emits MessagePickedUp

    Ok(())
}
