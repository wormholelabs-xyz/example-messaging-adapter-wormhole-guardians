use anchor_lang::prelude::*;

pub mod error;
pub mod event;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Gfo1Jn4zHvc8BBGWNPQpNDZob5DsG2bhmS4wEA2GKFx6");

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

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        instructions::admin::initialize(ctx, args)
    }
}
