use anchor_lang::prelude::*;

pub mod error;
pub mod event;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("74nfEtQSch83m7hk6odpHGxis6R4Vyu56ZWxwBoCXtdD");

cfg_if::cfg_if! {
    if #[cfg(feature = "solana")] {
        pub const CHAIN_ID: u16 = 1;
    } else {
        compile_error!("The 'solana' feature must be enabled.");
    }
}

#[program]
pub mod wormhole_guardian_adapter {
    use super::*;

    /// Initializes the program with admin and configuration settings.
    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        instructions::admin::initialize(ctx, args)
    }

    /// Starts the two-step admin transfer process by setting a pending admin.
    pub fn transfer_admin(ctx: Context<TransferAdmin>, args: TransferAdminArgs) -> Result<()> {
        instructions::admin::transfer_admin(ctx, args)
    }

    /// Completes the admin transfer by allowing pending admin OR current admin to claim the role.
    pub fn claim_admin(ctx: Context<ClaimAdmin>) -> Result<()> {
        instructions::admin::claim_admin(ctx)
    }

    /// Immediately updates admin without requiring two-step process.
    pub fn update_admin(ctx: Context<UpdateAdmin>, args: UpdateAdminArgs) -> Result<()> {
        instructions::admin::update_admin(ctx, args)
    }

    /// Discards admin by setting the admin field to None in config.
    pub fn discard_admin(ctx: Context<DiscardAdmin>) -> Result<()> {
        instructions::admin::discard_admin(ctx)
    }

    /// Registers a peer contract for this adapter.
    pub fn set_peer(ctx: Context<SetPeer>, args: SetPeerArgs) -> Result<()> {
        instructions::admin::set_peer(ctx, args)
    }

    /// Picks up a message from endpoint outbox and posts it to Wormhole.
    pub fn pick_up_message(ctx: Context<PickUpMessage>) -> Result<()> {
        instructions::pick_up_message::pick_up_message(ctx)
    }

    /// Receives a Wormhole VAA and attests it to the endpoint program.
    pub fn recv_message(ctx: Context<ReceiveMessage>, args: ReceiveMessageArgs) -> Result<()> {
        instructions::recv_message::recv_message(ctx, args)
    }
}
