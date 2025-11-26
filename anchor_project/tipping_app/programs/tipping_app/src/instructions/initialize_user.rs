use anchor_lang::prelude::*;
use crate::state::{UserProfile, UserVault, TipHistory};

pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let user_vault = &mut ctx.accounts.user_vault;
    let tip_history = &mut ctx.accounts.tip_history;
    let clock = Clock::get()?;

    // Initialize user profile
    user_profile.owner = ctx.accounts.user.key();
    user_profile.total_sent = 0;
    user_profile.total_received = 0;
    user_profile.tips_sent_count = 0;
    user_profile.tips_received_count = 0;
    user_profile.created_at = clock.unix_timestamp;
    user_profile.bump = ctx.bumps.user_profile;

    // Initialize user vault
    user_vault.owner = ctx.accounts.user.key();
    user_vault.balance = 0;
    user_vault.created_at = clock.unix_timestamp;
    user_vault.bump = ctx.bumps.user_vault;

    // Initialize tip history
    tip_history.owner = ctx.accounts.user.key();
    tip_history.current_index = 0;
    tip_history.bump = ctx.bumps.tip_history;

    msg!("User initialized: {}", ctx.accounts.user.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        init,
        payer = user,
        space = UserVault::LEN,
        seeds = [b"user_vault", user.key().as_ref()],
        bump
    )]
    pub user_vault: Account<'info, UserVault>,
    
    #[account(
        init,
        payer = user,
        space = TipHistory::LEN,
        seeds = [b"tip_history", user.key().as_ref()],
        bump
    )]
    pub tip_history: Account<'info, TipHistory>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

