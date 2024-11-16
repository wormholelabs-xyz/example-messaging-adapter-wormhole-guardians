use crate::{
    error::WormholeGuardiansAdapterError,
    event::{AdminDiscarded, AdminUpdateRequested, AdminUpdated, PeerAdded},
    state::*,
};
use anchor_lang::prelude::*;

// Initialize
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub admin: Pubkey,
    pub wormhole_program: Pubkey,
    pub consistency_level: Finality,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [Config::SEED_PREFIX],
        bump
    )]
    // SPEC: Creates new config PDA to store program settings
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Initializes the Wormhole Guardian Adapter program with initial configuration.
///
/// This function performs the following steps:
/// 1. Creates a new Config PDA account to store program settings
/// 2. Initializes the Config with provided admin, endpoint, and wormhole settings
///
/// # Arguments
///
/// * `ctx` - The context of the instruction, containing the accounts involved
/// * `args` - The arguments for initialization, including:
///   * `admin`: The initial admin public key
///   * `wormhole_program`: The wormhole program public key
///   * `consistency_level`: The wormhole consistency level setting
pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    // SPEC: Initialize config PDA with admin, endpoint, and wormhole settings
    ctx.accounts.config.set_inner(Config {
        bump: ctx.bumps.config,
        admin: Some(args.admin),
        pending_admin: None,
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
        seeds = [Config::SEED_PREFIX],
        bump = config.bump,
        // SPEC: Caller must be current admin with no pending transfer
        constraint = config.pending_admin.is_none() @ WormholeGuardiansAdapterError::AdminTransferPending,
        constraint = config.admin == Some(admin.key()) @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

/// Initiates a two-step admin transfer process.
///
/// This function performs the following steps:
/// 1. Verifies caller is current admin with no pending transfer
/// 2. Validates new admin is not zero address
/// 3. Sets pending_admin in Config to new admin
///
/// # Arguments
///
/// * `ctx` - The context of the instruction
/// * `args` - The arguments containing:
///   * `new_admin`: The proposed new admin public key
///
/// # Errors
///
/// This function will return an error if:
/// * Caller is not current admin (CallerNotAdmin)
/// * There is already a pending transfer (AdminTransferPending)
/// * New admin is zero address (InvalidAdminZeroAddress)
///
/// # Events
///
/// Emits an `AdminUpdateRequested` event with:
/// * `current_admin`: Current admin's public key
/// * `proposed_admin`: Proposed new admin's public key
pub fn transfer_admin(ctx: Context<TransferAdmin>, args: TransferAdminArgs) -> Result<()> {
    // SPEC: New admin cannot be zero address
    require!(
        args.new_admin != Pubkey::default(),
        WormholeGuardiansAdapterError::InvalidAdminZeroAddress
    );

    // SPEC: Initiates two-step admin transfer process by setting pending_admin
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
        seeds = [Config::SEED_PREFIX],
        bump,
        // SPEC: Must have pending admin transfer
        constraint = config.pending_admin.is_some() @ WormholeGuardiansAdapterError::NoAdminUpdatePending,
        // SPEC: Caller must be current admin OR pending admin
        constraint = (config.admin == Some(new_admin.key()) || config.pending_admin == Some(new_admin.key())) @ WormholeGuardiansAdapterError::CallerNotAdmin,
    )]
    pub config: Account<'info, Config>,

    pub new_admin: Signer<'info>,
}

/// Completes a pending admin transfer by claiming admin rights.
///
/// This function performs the following steps:
/// 1. Verifies there is a pending admin transfer
/// 2. Validates caller is either current admin or pending admin
/// 3. Updates admin to caller and clears pending_admin
///
/// # Arguments
///
/// * `ctx` - The context of the instruction
///
/// # Errors
///
/// This function will return an error if:
/// * No pending admin transfer exists (NoAdminUpdatePending)
/// * Caller is neither current nor pending admin (CallerNotAdmin)
///
/// # Events
///
/// Emits an `AdminUpdated` event with:
/// * `old_admin`: Previous admin's public key
/// * `new_admin`: New admin's public key
pub fn claim_admin(ctx: Context<ClaimAdmin>) -> Result<()> {
    let old_admin = ctx.accounts.config.admin.unwrap();
    ctx.accounts.config.admin = Some(ctx.accounts.new_admin.key());
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
        seeds = [Config::SEED_PREFIX],
        bump,
        // SPEC: Caller must be current admin with no pending transfer
        constraint = config.pending_admin.is_none() @ WormholeGuardiansAdapterError::AdminTransferPending,
        constraint = config.admin == Some(admin.key()) @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

/// Immediately updates the admin without two-step process.
///
/// This function performs the following steps:
/// 1. Verifies caller is current admin with no pending transfer
/// 2. Validates new admin is not zero address
/// 3. Immediately updates admin and clears any pending admin
///
/// # Arguments
///
/// * `ctx` - The context of the instruction
/// * `args` - The arguments containing:
///   * `new_admin`: The new admin public key
///
/// # Errors
///
/// This function will return an error if:
/// * Caller is not current admin (CallerNotAdmin)
/// * There is a pending transfer (AdminTransferPending)
/// * New admin is zero address (InvalidAdminZeroAddress)
///
/// # Events
///
/// Emits an `AdminUpdated` event with:
/// * `old_admin`: Previous admin's public key
/// * `new_admin`: New admin's public key
pub fn update_admin(ctx: Context<UpdateAdmin>, args: UpdateAdminArgs) -> Result<()> {
    // SPEC: New admin cannot be zero address
    require!(
        args.new_admin != Pubkey::default(),
        WormholeGuardiansAdapterError::InvalidAdminZeroAddress
    );

    let old_admin = ctx.accounts.config.admin.unwrap();
    // SPEC: Immediately sets newAdmin as admin
    ctx.accounts.config.admin = Some(args.new_admin);
    ctx.accounts.config.pending_admin = None;

    emit_cpi!(AdminUpdated {
        old_admin,
        new_admin: args.new_admin,
    });

    Ok(())
}

#[event_cpi]
#[derive(Accounts)]
pub struct DiscardAdmin<'info> {
    #[account(
        mut,
        seeds = [Config::SEED_PREFIX],
        bump = config.bump,
        // SPEC: Caller must be current admin with no pending transfer
        constraint = config.pending_admin.is_none() @ WormholeGuardiansAdapterError::AdminTransferPending,
        constraint = config.admin == Some(admin.key()) @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    pub admin: Signer<'info>,
}

/// Discards the current admin, setting the admin field to None.
///
/// # Arguments
///
/// * `ctx` - The context of the instruction, containing the accounts involved
///
/// # Errors
///
/// This function will return an error if:
/// * Caller is not current admin (CallerNotAdmin)
/// * There is a pending transfer (AdminTransferPending)
///
/// # Events
///
/// Emits an `AdminDiscarded` event with:
/// * `admin`: The public key of the discarded admin

pub fn discard_admin(ctx: Context<DiscardAdmin>) -> Result<()> {
    let old_admin = ctx.accounts.config.admin.unwrap();
    ctx.accounts.config.admin = None;

    emit_cpi!(AdminDiscarded { admin: old_admin });

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
        seeds = [Config::SEED_PREFIX],
        bump = config.bump,
        // SPEC: Only admin can set peer contracts
        constraint = config.admin == Some(admin.key()) @ WormholeGuardiansAdapterError::CallerNotAdmin
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + Peer::INIT_SPACE,
        seeds = [Peer::SEED_PREFIX, args.peer_chain.to_be_bytes().as_ref()],
        bump
    )]
    pub peer: Account<'info, Peer>,

    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Sets s a peer contract for a chain.
///
/// This function performs the following steps:
/// 1. Verifies caller is current admin
/// 2. Validates peer chain and contract are non-zero
/// 3. Ensures peer is not already set for the chain
/// 4. Creates/update peer PDA with contract information
///
/// # Arguments
///
/// * `ctx` - The context of the instruction
/// * `args` - The arguments containing:
///   * `peer_chain`: The chain ID for the peer
///   * `peer_contract`: The contract address bytes for the peer
///
/// # Errors
///
/// This function will return an error if:
/// * Caller is not admin (CallerNotAdmin)
/// * Peer chain is zero (InvalidChain)
/// * Peer contract is zero address (InvalidPeerZeroAddress)
/// * Peer already set for chain (PeerAlreadySet)
///
/// # Side Effects
///
/// * Creates or updates Peer PDA account
///
/// # Events
///
/// Emits a `PeerAdded` event with:
/// * `chain`: The peer chain ID
/// * `peer_contract`: The peer contract address
pub fn set_peer(ctx: Context<SetPeer>, args: SetPeerArgs) -> Result<()> {
    // SPEC: Peer chain must be non-zero
    require!(
        args.peer_chain != 0,
        WormholeGuardiansAdapterError::InvalidChain
    );

    // SPEC: Peer contract must be non-zero address
    require!(
        args.peer_contract != [0u8; 32],
        WormholeGuardiansAdapterError::InvalidPeerZeroAddress
    );

    // SPEC: Each chain can only have one peer contract
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
