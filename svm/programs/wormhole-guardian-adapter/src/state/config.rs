use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Config {
    pub bump: u8,
    pub admin: Pubkey,
    pub pending_admin: Option<Pubkey>,
    pub endpoint: Pubkey,
    pub wormhole_program: Pubkey,
    pub consistency_level: u8,
}

impl Config {
    pub const SEED_PREFIX: &'static [u8] = b"config";
}
