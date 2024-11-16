use anchor_lang::prelude::*;

// This is compatible with that finality in `wormhole_anchor_sdk::wormhole::Finality`
// We need our own type has the `wormhole_anchor_sdk::wormhole::Finality` does not implement InitSpace
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Finality {
    Confirmed,
    Finalized,
}

impl From<Finality> for wormhole_anchor_sdk::wormhole::Finality {
    fn from(value: Finality) -> Self {
        match value {
            Finality::Confirmed => Self::Confirmed,
            Finality::Finalized => Self::Finalized,
        }
    }
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
