use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Peer {
    /// Used for seed derivation
    pub bump: u8,
    /// Used for seed derivation
    pub chain: u16,
    pub contract: [u8; 32],
}

impl Peer {
    pub const SEED_PREFIX: &'static [u8] = b"peer";
}
