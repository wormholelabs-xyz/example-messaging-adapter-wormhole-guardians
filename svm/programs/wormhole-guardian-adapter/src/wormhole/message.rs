// The `deserialize_reader` is based on that in `example-native-token-transfers` TransceiverMessage
// The reason for a custom `deserialize_read` is that BorshDeserialize uses little endian but `GuardianMessage`
// uses big endian
// https://github.com/wormhole-foundation/example-native-token-transfers/blob/main/solana/modules/ntt-messages/src/transceiver.rs#L20
use anchor_lang::prelude::*;
use std::io;
use universal_address::UniversalAddress;
use wormhole_io::Readable;

#[derive(AnchorSerialize, Clone, Debug)]
pub struct GuardianMessage {
    pub src_addr: UniversalAddress,
    pub sequence: u64,
    pub dst_chain: u16,
    pub dst_addr: UniversalAddress,
    pub payload_hash: [u8; 32],
}

impl AnchorDeserialize for GuardianMessage {
    fn deserialize_reader<R: io::Read>(reader: &mut R) -> io::Result<Self> {
        Readable::read(reader)
    }
}

impl GuardianMessage {
    pub fn to_vec(&self) -> Vec<u8> {
        // Match EVM encoding: abi.encodePacked(srcAddr, sequence, dstChain, dstAddr, payloadHash)
        let mut bytes = Vec::with_capacity(106); // 32 + 8 + 2 + 32 + 32
        bytes.extend_from_slice(&self.src_addr.to_bytes());
        bytes.extend_from_slice(&self.sequence.to_be_bytes());
        bytes.extend_from_slice(&self.dst_chain.to_be_bytes());
        bytes.extend_from_slice(&self.dst_addr.to_bytes());
        bytes.extend_from_slice(&self.payload_hash);
        bytes
    }
}

impl Readable for GuardianMessage {
    const SIZE: Option<usize> = Some(106);

    fn read<R>(reader: &mut R) -> io::Result<Self>
    where
        Self: Sized,
        R: io::Read,
    {
        // Read src_addr
        let mut src_addr_bytes = [0u8; 32];
        reader.read_exact(&mut src_addr_bytes)?;
        let src_addr = UniversalAddress::from_bytes(src_addr_bytes);

        // Read and debug sequence
        let mut sequence_bytes = [0u8; 8];
        reader.read_exact(&mut sequence_bytes)?;
        let sequence = u64::from_be_bytes(sequence_bytes);

        // Read and debug dst_chain
        let mut chain_bytes = [0u8; 2];
        reader.read_exact(&mut chain_bytes)?;
        let dst_chain = u16::from_be_bytes(chain_bytes);

        // Read dst_addr
        let mut dst_addr_bytes = [0u8; 32];
        reader.read_exact(&mut dst_addr_bytes)?;
        let dst_addr = UniversalAddress::from_bytes(dst_addr_bytes);

        // Read payload_hash
        let mut payload_hash = [0u8; 32];
        reader.read_exact(&mut payload_hash)?;

        Ok(Self {
            src_addr,
            sequence,
            dst_chain,
            dst_addr,
            payload_hash,
        })
    }
}
