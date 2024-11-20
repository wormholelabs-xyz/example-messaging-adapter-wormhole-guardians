declare_program!(endpoint);

use crate::wormhole::accounts::*;
use crate::wormhole::post_message;
use crate::wormhole::GuardianMessage;
use anchor_lang::prelude::*;
use endpoint::{accounts::OutboxMessage, program::Endpoint, types::PickUpMessageArgs};

use wormhole_io::{Readable, TypePrefixedPayload, Writeable};

/// Accounts struct for the pick_up_message instruction
#[derive(Accounts)]
pub struct PickUpMessage<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The outbox message account to be picked up
    /// This account is mutable so we can update the `outstanding_adapters` state
    #[account(
        mut,
        has_one = refund_recipient
    )]
    pub outbox_message: Account<'info, OutboxMessage>,

    /// The adapter info account
    /// CHECK: This account is checked by the endpoint program
    pub adapter_info: UncheckedAccount<'info>,

    /// The adapter PDA account, used for signing
    #[account(
        seeds = [b"adapter_pda"],
        bump,
    )]
    pub adapter_pda: SystemAccount<'info>,

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

    /// The system program
    pub system_program: Program<'info, System>,

    /// The endpoint program
    pub endpoint_program: Program<'info, Endpoint>,

    #[account(
        mut,
        seeds = [b"message", outbox_message.key().as_ref()],
        bump,
    )]
    /// CHECK: initialized and written to by wormhole core bridge
    pub wormhole_message: UncheckedAccount<'info>,

    #[account(
        seeds = [b"emitter"],
        bump
    )]
    /// CHECK: wormhole uses this as the emitter address
    pub emitter: UncheckedAccount<'info>,

    /// The Wormhole accounts needed for posting messages
    pub wormhole: WormholeAccounts<'info>,
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

/// Executes the pick_up_message instruction on the endpoint program via CPI
///
/// This function demonstrates how an adapter program would interact
/// with the endpoint program to pick up a message from the outbox.
pub fn pick_up_message(ctx: Context<PickUpMessage>) -> Result<()> {
    // Prepare the seeds for PDA signing
    let bump_seed = &[ctx.bumps.adapter_pda][..];
    let signer_seeds: &[&[&[u8]]] = &[&[b"adapter_pda", bump_seed]];

    // Perform the CPI call to the endpoint program's pick_up_message instruction
    endpoint::cpi::pick_up_message(
        ctx.accounts
            .pick_up_message_context()
            .with_signer(signer_seeds),
        PickUpMessageArgs {
            adapter_program_id: crate::id(),
            adapter_pda_bump: ctx.bumps.adapter_pda,
        },
    )?;

    // Create the Wormhole message
    let message = GuardianMessage {
        src_addr: ctx.accounts.outbox_message.src_addr.bytes,
        sequence: ctx.accounts.outbox_message.sequence,
        dst_chain: ctx.accounts.outbox_message.dst_chain,
        dst_addr: ctx.accounts.outbox_message.dst_addr.bytes,
        payload_hash: ctx.accounts.outbox_message.payload_hash,
    };

    post_message(
        &ctx.accounts.wormhole,
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.wormhole_message.to_account_info(),
        ctx.accounts.emitter.to_account_info(),
        ctx.bumps.emitter,
        &message,
        &[&[
            b"message",
            ctx.accounts.outbox_message.key().as_ref(),
            &[ctx.bumps.wormhole_message],
        ]],
    )?;

    Ok(())
}
