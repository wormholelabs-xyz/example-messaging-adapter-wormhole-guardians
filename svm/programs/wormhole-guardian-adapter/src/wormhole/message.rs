use anchor_lang::prelude::*;
use wormhole_io::{Readable, TypePrefixedPayload, Writeable};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct GuardianMessage {
    pub src_addr: [u8; 32],
    pub sequence: u64,
    pub dst_chain: u16,
    pub dst_addr: [u8; 32],
    pub payload_hash: [u8; 32],
}

impl TypePrefixedPayload for GuardianMessage {
    const TYPE: Option<u8> = Some(1); // You might want to use a different type number
}

impl Readable for GuardianMessage {
    const SIZE: Option<usize> = Some(106); // 32 + 8 + 2 + 32 + 32

    fn read<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        Ok(Self {
            src_addr: Readable::read(reader)?,
            sequence: Readable::read(reader)?,
            dst_chain: Readable::read(reader)?,
            dst_addr: Readable::read(reader)?,
            payload_hash: Readable::read(reader)?,
        })
    }
}

impl Writeable for GuardianMessage {
    fn written_size(&self) -> usize {
        Self::SIZE.unwrap()
    }

    fn write<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        self.src_addr.write(writer)?;
        self.sequence.write(writer)?;
        self.dst_chain.write(writer)?;
        self.dst_addr.write(writer)?;
        self.payload_hash.write(writer)?;
        Ok(())
    }
}
