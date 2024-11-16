use anchor_lang::prelude::*;

#[error_code]
#[derive(PartialEq)]
pub enum WormholeGuardiansAdapterError {
    #[msg("Caller is not the admin")]
    CallerNotAdmin,

    #[msg("Admin transfer is already pending")]
    AdminTransferPending,

    #[msg("No admin update is pending")]
    NoAdminUpdatePending,

    #[msg("Invalid zero address provided for admin")]
    InvalidAdminZeroAddress,

    #[msg("Caller is not the endpoint")]
    CallerNotEndpoint,

    #[msg("Invalid chain ID")]
    InvalidChain,

    #[msg("Invalid peer address (zero address)")]
    InvalidPeerZeroAddress,

    #[msg("Peer already set for chain")]
    PeerAlreadySet,

    #[msg("Invalid VAA format")]
    InvalidVaa,

    #[msg("Invalid peer for emitter chain")]
    InvalidPeer,

    #[msg("Invalid payload length")]
    InvalidPayloadLength,
}
