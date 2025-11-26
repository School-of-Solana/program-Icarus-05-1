use anchor_lang::prelude::*;
use crate::state::UserVault;
use crate::errors::TippingError;

pub fn withdraw_tips(ctx: Context<WithdrawTips>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &mut ctx.accounts.user_vault;
    
    // Validate amount
    require!(amount > 0, TippingError::InvalidAmount);
    
    // Check vault has sufficient balance
    require!(vault.balance >= amount, TippingError::VaultEmpty);
    
    // Calculate rent-exempt minimum for the vault account
    let rent = Rent::get()?;
    let vault_account_info = vault.to_account_info();
    let rent_exempt_minimum = rent.minimum_balance(vault_account_info.data_len());
    
    // Ensure vault account remains rent-exempt after withdrawal
    let vault_lamports = vault_account_info.lamports();
    require!(
        vault_lamports.saturating_sub(amount) >= rent_exempt_minimum,
        TippingError::InsufficientFunds
    );
    
    // Transfer lamports from vault to user
    **vault_account_info.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;
    
    // Update vault balance
    vault.balance = vault.balance
        .checked_sub(amount)
        .ok_or(TippingError::ArithmeticOverflow)?;
    
    // Emit event
    emit!(WithdrawEvent {
        user: ctx.accounts.user.key(),
        amount,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Withdrawn {} lamports to {}", amount, ctx.accounts.user.key());
    
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawTips<'info> {
    #[account(
        mut,
        seeds = [b"user_vault", user.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.owner == user.key() @ TippingError::Unauthorized
    )]
    pub user_vault: Account<'info, UserVault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

