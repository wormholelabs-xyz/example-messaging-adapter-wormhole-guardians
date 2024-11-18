use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Peer {
    pub bump: u8,
    pub chain: u16,
    pub contract: [u8; 32],
}
