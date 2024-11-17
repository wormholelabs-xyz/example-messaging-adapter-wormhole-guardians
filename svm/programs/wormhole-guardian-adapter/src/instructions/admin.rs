use crate::{
    error::WormholeGuardiansAdapterError,
    event::{AdminUpdateRequested, AdminUpdated},
    state::*,
};
use anchor_lang::prelude::*;

// Initialize
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub admin: Pubkey,
    pub endpoint: Pubkey,
    pub wormhole_program: Pubkey,
    pub consistency_level: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    ctx.accounts.config.set_inner(Config {
        bump: ctx.bumps.config,
        admin: args.admin,
        pending_admin: None,
        endpoint: args.endpoint,
        wormhole_program: args.wormhole_program,
        consistency_level: args.consistency_level,
    });

    Ok(())
}

// Transfer Admin
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TransferAdminArgs {
    pub new_admin: Pubkey,
}

#[event_cpi]
#[derive(Accounts)]
pub struct TransferAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.pending_admin.is_none() @ WormholeGuardiansAdapterError::AdminTransferPending,
        constraint = config.admin == admin.key() @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

pub fn transfer_admin(ctx: Context<TransferAdmin>, args: TransferAdminArgs) -> Result<()> {
    ctx.accounts.config.pending_admin = Some(args.new_admin);

    emit_cpi!(AdminUpdateRequested {
        current_admin: ctx.accounts.admin.key(),
        proposed_admin: args.new_admin,
    });

    Ok(())
}

// Claim Admin
#[event_cpi]
#[derive(Accounts)]
pub struct ClaimAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        constraint = config.pending_admin.is_some() @ WormholeGuardiansAdapterError::NoAdminUpdatePending,
        constraint = config.pending_admin == Some(new_admin.key()) @ WormholeGuardiansAdapterError::CallerNotAdmin,
    )]
    pub config: Account<'info, Config>,

    pub new_admin: Signer<'info>,
}

pub fn claim_admin(ctx: Context<ClaimAdmin>) -> Result<()> {
    let old_admin = ctx.accounts.config.admin;
    ctx.accounts.config.admin = ctx.accounts.new_admin.key();
    ctx.accounts.config.pending_admin = None;

    emit_cpi!(AdminUpdated {
        old_admin,
        new_admin: ctx.accounts.new_admin.key(),
    });

    Ok(())
}

// Update Admin
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAdminArgs {
    pub new_admin: Pubkey,
}

#[event_cpi]
#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        constraint = config.pending_admin.is_none() @ WormholeGuardiansAdapterError::AdminTransferPending,
        constraint = config.admin == admin.key() @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

pub fn update_admin(ctx: Context<UpdateAdmin>, args: UpdateAdminArgs) -> Result<()> {
    require!(
        args.new_admin != Pubkey::default(),
        WormholeGuardiansAdapterError::InvalidAdminZeroAddress
    );

    let old_admin = ctx.accounts.config.admin;
    ctx.accounts.config.admin = args.new_admin;
    ctx.accounts.config.pending_admin = None;

    emit_cpi!(AdminUpdated {
        old_admin,
        new_admin: args.new_admin,
    });

    Ok(())
}
