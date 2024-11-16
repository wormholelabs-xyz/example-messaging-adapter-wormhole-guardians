use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeArgs {
    pub admin: Pubkey,
    pub endpoint: Pubkey,
    pub wormhole_program: Pubkey,
    pub consistency_level: u8,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    ctx.accounts.config.set_inner(Config {
        admin: args.admin,
        pending_admin: None,
        endpoint: args.endpoint,
        wormhole_program: args.wormhole_program,
        consistency_level: args.consistency_level,
    });

    Ok(())
}
