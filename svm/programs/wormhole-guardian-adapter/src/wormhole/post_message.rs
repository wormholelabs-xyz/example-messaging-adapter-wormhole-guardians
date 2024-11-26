// `post_message` helper is copied and tweaked from `example-native-token-transfers`
// https://github.com/wormhole-foundation/example-native-token-transfers/blob/main/solana/programs/example-native-token-transfers/src/transceivers/wormhole/accounts.rs
use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole::{self, Finality};

use super::{accounts::WormholeAccounts, GuardianMessage};

pub fn post_message<'info>(
    wormhole: &WormholeAccounts<'info>,
    payer: AccountInfo<'info>,
    message: AccountInfo<'info>,
    emitter: AccountInfo<'info>,
    emitter_bump: u8,
    payload: &GuardianMessage,
    additional_seeds: &[&[&[u8]]],
    finality: Finality,
) -> Result<()> {
    let batch_id = 0;

    pay_wormhole_fee(wormhole, &payer)?;

    let ix = wormhole::PostMessage {
        config: wormhole.bridge.to_account_info(),
        message,
        emitter,
        sequence: wormhole.sequence.to_account_info(),
        payer: payer.to_account_info(),
        fee_collector: wormhole.fee_collector.to_account_info(),
        clock: wormhole.clock.to_account_info(),
        rent: wormhole.rent.to_account_info(),
        system_program: wormhole.system_program.to_account_info(),
    };

    let seeds: &[&[&[&[u8]]]] = &[
        &[&[b"emitter".as_slice(), &[emitter_bump]]],
        additional_seeds,
    ];

    wormhole::post_message(
        CpiContext::new_with_signer(wormhole.program.to_account_info(), ix, &seeds.concat()),
        batch_id,
        payload.to_vec(),
        finality,
    )?;

    Ok(())
}

fn pay_wormhole_fee<'info>(
    wormhole: &WormholeAccounts<'info>,
    payer: &AccountInfo<'info>,
) -> Result<()> {
    if wormhole.bridge.fee() > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                wormhole.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: payer.to_account_info(),
                    to: wormhole.fee_collector.to_account_info(),
                },
            ),
            wormhole.bridge.fee(),
        )?;
    }

    Ok(())
}
