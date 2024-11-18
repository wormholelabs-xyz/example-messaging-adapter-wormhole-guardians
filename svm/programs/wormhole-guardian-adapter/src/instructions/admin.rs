use crate::{
    error::WormholeGuardiansAdapterError,
    event::{AdminUpdateRequested, AdminUpdated, PeerAdded},
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

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetPeerArgs {
    pub peer_chain: u16,
    pub peer_contract: [u8; 32],
}

#[event_cpi]
#[derive(Accounts)]
#[instruction(args: SetPeerArgs)]
pub struct SetPeer<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Peer::INIT_SPACE,
        seeds = [b"peer", args.peer_chain.to_be_bytes().as_ref()],
        bump
    )]
    pub peer: Account<'info, Peer>,

    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn set_peer(ctx: Context<SetPeer>, args: SetPeerArgs) -> Result<()> {
    // Validate chain ID is not zero
    require!(
        args.peer_chain != 0,
        WormholeGuardiansAdapterError::InvalidChain
    );

    // Validate peer contract is not zero address
    require!(
        args.peer_contract != [0u8; 32],
        WormholeGuardiansAdapterError::InvalidPeerZeroAddress
    );

    // Check if peer is already initialized with a contract
    require!(
        ctx.accounts.peer.chain == 0,
        WormholeGuardiansAdapterError::PeerAlreadySet
    );

    // Set the peer contract
    ctx.accounts.peer.set_inner(Peer {
        bump: ctx.bumps.peer,
        chain: args.peer_chain,
        contract: args.peer_contract,
    });

    emit_cpi!(PeerAdded {
        chain: args.peer_chain,
        peer_contract: args.peer_contract,
    });

    Ok(())
}
