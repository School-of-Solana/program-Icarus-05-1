use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{UserProfile, UserVault, TipTransaction, TipHistory, TipRecord};
use crate::errors::TippingError;

pub fn send_tip(ctx: Context<SendTip>, amount: u64, message: String, tip_seed: u64) -> Result<()> {
    let clock = Clock::get()?;
    
    // Validate amount
    require!(amount > 0, TippingError::InvalidAmount);
    
    // Validate message length
    require!(message.len() <= 32, TippingError::MessageTooLong);
    
    // Validate tip_seed is reasonable (within last 5 minutes or in future)
    // This prevents replay attacks with old seeds
    let current_time = clock.unix_timestamp as u64;
    let five_minutes = 300u64;
    require!(
        tip_seed >= current_time.saturating_sub(five_minutes) && tip_seed <= current_time.saturating_add(five_minutes),
        TippingError::InvalidTipSeed
    );
    
    // Check sender has sufficient funds
    let sender_balance = ctx.accounts.sender.lamports();
    let rent_exempt_minimum = Rent::get()?.minimum_balance(0);
    require!(
        sender_balance.saturating_sub(amount) >= rent_exempt_minimum,
        TippingError::InsufficientFunds
    );

    // Transfer SOL from sender to receiver's vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.sender.to_account_info(),
            to: ctx.accounts.receiver_vault.to_account_info(),
        },
    );
    transfer(cpi_context, amount)?;

    // Update receiver vault balance
    ctx.accounts.receiver_vault.balance = ctx.accounts.receiver_vault.balance
        .checked_add(amount)
        .ok_or(TippingError::ArithmeticOverflow)?;

    // Check if sender and receiver are the same (self-tipping)
    let is_self_tip = ctx.accounts.sender.key() == ctx.accounts.receiver.key();
    
    if is_self_tip {
        // Self-tip: Both sender_profile and receiver_profile point to the same PDA account.
        // Anchor will serialize BOTH back to storage at the end of the instruction.
        // To avoid one overwriting the other, we must update BOTH with the final values.
        
        // Calculate new values
        let new_total_sent = ctx.accounts.sender_profile.total_sent
            .checked_add(amount)
            .ok_or(TippingError::ArithmeticOverflow)?;
        let new_tips_sent_count = ctx.accounts.sender_profile.tips_sent_count
            .checked_add(1)
            .ok_or(TippingError::ArithmeticOverflow)?;
        let new_total_received = ctx.accounts.sender_profile.total_received
            .checked_add(amount)
            .ok_or(TippingError::ArithmeticOverflow)?;
        let new_tips_received_count = ctx.accounts.sender_profile.tips_received_count
            .checked_add(1)
            .ok_or(TippingError::ArithmeticOverflow)?;
        
        // Update sender_profile
        ctx.accounts.sender_profile.total_sent = new_total_sent;
        ctx.accounts.sender_profile.tips_sent_count = new_tips_sent_count;
        ctx.accounts.sender_profile.total_received = new_total_received;
        ctx.accounts.sender_profile.tips_received_count = new_tips_received_count;
        
        // Update receiver_profile with same values (since it's the same account)
        ctx.accounts.receiver_profile.total_sent = new_total_sent;
        ctx.accounts.receiver_profile.tips_sent_count = new_tips_sent_count;
        ctx.accounts.receiver_profile.total_received = new_total_received;
        ctx.accounts.receiver_profile.tips_received_count = new_tips_received_count;
    } else {
        // Normal tip: update sender and receiver profiles separately
        // Update sender profile
        ctx.accounts.sender_profile.total_sent = ctx.accounts.sender_profile.total_sent
            .checked_add(amount)
            .ok_or(TippingError::ArithmeticOverflow)?;
        ctx.accounts.sender_profile.tips_sent_count = ctx.accounts.sender_profile.tips_sent_count
            .checked_add(1)
            .ok_or(TippingError::ArithmeticOverflow)?;

        // Update receiver profile
        ctx.accounts.receiver_profile.total_received = ctx.accounts.receiver_profile.total_received
            .checked_add(amount)
            .ok_or(TippingError::ArithmeticOverflow)?;
        ctx.accounts.receiver_profile.tips_received_count = ctx.accounts.receiver_profile.tips_received_count
            .checked_add(1)
            .ok_or(TippingError::ArithmeticOverflow)?;
    }

    // Store tip transaction
    let tip_transaction = &mut ctx.accounts.tip_transaction;
    tip_transaction.sender = ctx.accounts.sender.key();
    tip_transaction.receiver = ctx.accounts.receiver.key();
    tip_transaction.amount = amount;
    tip_transaction.message = message.clone();
    tip_transaction.timestamp = clock.unix_timestamp;
    tip_transaction.tip_seed = tip_seed;
    tip_transaction.bump = ctx.bumps.tip_transaction;

    // Update tip history
    if is_self_tip {
        // Self-tip: sender_history and receiver_history point to the same account.
        // We need to add both records and keep both account copies in sync.
        let sent_record = TipRecord {
            counterparty: ctx.accounts.receiver.key(),
            amount,
            is_sent: true,
            timestamp: clock.unix_timestamp,
        };
        ctx.accounts.sender_history.add_tip(sent_record);
        
        let received_record = TipRecord {
            counterparty: ctx.accounts.sender.key(),
            amount,
            is_sent: false,
            timestamp: clock.unix_timestamp,
        };
        ctx.accounts.sender_history.add_tip(received_record);
        
        // Sync receiver_history with sender_history to prevent overwrite
        ctx.accounts.receiver_history.tips = ctx.accounts.sender_history.tips.clone();
        ctx.accounts.receiver_history.current_index = ctx.accounts.sender_history.current_index;
    } else {
        // Normal tip: update sender and receiver histories separately
        let sender_tip_record = TipRecord {
            counterparty: ctx.accounts.receiver.key(),
            amount,
            is_sent: true,
            timestamp: clock.unix_timestamp,
        };
        ctx.accounts.sender_history.add_tip(sender_tip_record);

        let receiver_tip_record = TipRecord {
            counterparty: ctx.accounts.sender.key(),
            amount,
            is_sent: false,
            timestamp: clock.unix_timestamp,
        };
        ctx.accounts.receiver_history.add_tip(receiver_tip_record);
    }

    // Emit event
    emit!(TipSent {
        sender: ctx.accounts.sender.key(),
        receiver: ctx.accounts.receiver.key(),
        amount,
        message,
        timestamp: clock.unix_timestamp,
    });

    msg!("Tip sent: {} lamports from {} to {}", amount, ctx.accounts.sender.key(), ctx.accounts.receiver.key());

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, message: String, tip_seed: u64)]
pub struct SendTip<'info> {
    #[account(
        mut,
        seeds = [b"user_profile", sender.key().as_ref()],
        bump = sender_profile.bump,
        constraint = sender_profile.owner == sender.key() @ TippingError::Unauthorized
    )]
    pub sender_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"tip_history", sender.key().as_ref()],
        bump = sender_history.bump
    )]
    pub sender_history: Account<'info, TipHistory>,
    
    #[account(
        mut,
        seeds = [b"user_profile", receiver.key().as_ref()],
        bump = receiver_profile.bump
    )]
    pub receiver_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"user_vault", receiver.key().as_ref()],
        bump = receiver_vault.bump,
        constraint = receiver_vault.owner == receiver.key() @ TippingError::Unauthorized
    )]
    pub receiver_vault: Account<'info, UserVault>,
    
    #[account(
        mut,
        seeds = [b"tip_history", receiver.key().as_ref()],
        bump = receiver_history.bump
    )]
    pub receiver_history: Account<'info, TipHistory>,
    
    #[account(
        init,
        payer = sender,
        space = TipTransaction::LEN,
        seeds = [
            b"tip",
            sender.key().as_ref(),
            &tip_seed.to_le_bytes()
        ],
        bump
    )]
    pub tip_transaction: Account<'info, TipTransaction>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    /// CHECK: This is the receiver's public key
    pub receiver: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[event]
pub struct TipSent {
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
    pub message: String,
    pub timestamp: i64,
}
