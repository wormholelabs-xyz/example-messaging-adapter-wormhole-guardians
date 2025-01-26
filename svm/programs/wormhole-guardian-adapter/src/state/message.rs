// The `deserialize_reader` is based on that in `example-native-token-transfers` TransceiverMessage
// The reason for a custom `deserialize_read` is that BorshDeserialize uses little endian but `GuardianMessage`
// uses big endian
// https://github.com/wormhole-foundation/example-native-token-transfers/blob/main/solana/modules/ntt-messages/src/transceiver.rs#L20
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct Message<'a>(pub(crate) &'a [u8]);

impl<'a> AsRef<[u8]> for Message<'a> {
    fn as_ref(&self) -> &[u8] {
        self.0
    }
}

impl<'a> TryFrom<&'a [u8]> for Message<'a> {
    type Error = &'static str;

    fn try_from(value: &'a [u8]) -> Result<Self, Self::Error> {
        Self::parse(value)
    }
}

impl<'a> Message<'a> {
    pub fn src_addr(&self) -> [u8; 32] {
        self.0[0..32].try_into().unwrap()
    }

    pub fn sequence(&self) -> u64 {
        u64::from_be_bytes(self.0[32..40].try_into().unwrap())
    }

    pub fn dst_chain(&self) -> u16 {
        u16::from_be_bytes(self.0[40..42].try_into().unwrap())
    }

    pub fn dst_addr(&self) -> [u8; 32] {
        self.0[42..74].try_into().unwrap()
    }

    pub fn payload_hash(&self) -> [u8; 32] {
        self.0[74..106].try_into().unwrap()
    }

    pub fn parse(span: &'a [u8]) -> Result<Self, &'static str> {
        if span.len() != 106 {
            // 32 + 8 + 2 + 32 + 32
            return Err("Message: invalid length. Expected exactly 106 bytes.");
        }

        Ok(Self(span))
    }
}
