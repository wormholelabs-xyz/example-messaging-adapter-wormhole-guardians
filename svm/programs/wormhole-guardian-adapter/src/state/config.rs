use anchor_lang::prelude::*;

// This is compatible with that finality in `wormhole_post_message_shim::types::Finality`
// We need our own type as the `wormhole_post_message_shim::types::Finality` does not implement InitSpace
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Finality {
    Confirmed,
    Finalized,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Used for seed derivation
    pub bump: u8,
    pub admin: Option<Pubkey>,
    pub pending_admin: Option<Pubkey>,
    pub wormhole_program: Pubkey,
    pub consistency_level: Finality,
}

impl Config {
    pub const SEED_PREFIX: &'static [u8] = b"config";
}
