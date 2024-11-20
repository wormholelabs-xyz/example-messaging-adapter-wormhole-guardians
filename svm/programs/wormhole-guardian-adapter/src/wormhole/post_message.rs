use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole;
use wormhole_io::TypePrefixedPayload;

use super::accounts::WormholeAccounts;

pub fn post_message<'info, A: TypePrefixedPayload>(
    wormhole: &WormholeAccounts<'info>,
    payer: AccountInfo<'info>,
    message: AccountInfo<'info>,
    emitter: AccountInfo<'info>,
    emitter_bump: u8,
    payload: &A,
    additional_seeds: &[&[&[u8]]],
) -> Result<()> {
    let batch_id = 0;

    pay_wormhole_fee(wormhole, &payer)?;

    let ix = wormhole::PostMessage {
        config: wormhole.wormhole_bridge.to_account_info(),
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
        CpiContext::new_with_signer(wormhole.wormhole_program.to_account_info(), ix, &seeds.concat()),
        batch_id,
        TypePrefixedPayload::to_vec_payload(payload),
        wormhole::Finality::Finalized,
    )?;

    Ok(())
}

fn pay_wormhole_fee<'info>(
    wormhole: &WormholeAccounts<'info>,
    payer: &AccountInfo<'info>,
) -> Result<()> {
    if wormhole.wormhole_bridge.fee() > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                wormhole.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: payer.to_account_info(),
                    to: wormhole.fee_collector.to_account_info(),
                },
            ),
            wormhole.wormhole_bridge.fee(),
        )?;
    }

    Ok(())
}
