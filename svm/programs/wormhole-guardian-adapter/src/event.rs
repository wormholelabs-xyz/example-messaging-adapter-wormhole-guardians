use anchor_lang::prelude::*;

#[event]
pub struct AdminUpdated {
    pub old_admin: Pubkey,
    pub new_admin: Pubkey,
}

#[event]
pub struct AdminUpdateRequested {
    pub current_admin: Pubkey,
    pub proposed_admin: Pubkey,
}

#[event]
pub struct AdminDiscarded {
    pub admin: Pubkey,
}

#[event]
pub struct PeerAdded {
    pub chain: u16,
    pub peer_contract: [u8; 32],
}
