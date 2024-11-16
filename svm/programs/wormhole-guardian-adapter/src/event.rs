use anchor_lang::prelude::*;
use universal_address::UniversalAddress;

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

#[event]
pub struct MessageSent {
    pub src_addr: UniversalAddress,
    pub dst_chain: u16,
    pub dst_addr: UniversalAddress,
    pub sequence: u64,
    pub payload_hash: [u8; 32],
}

#[event]
pub struct MessageReceived {
    pub vaa_hash: [u8; 32],
    pub emitter_chain: u16,
    pub emitter_address: [u8; 32],
    pub sequence: u64,
}
