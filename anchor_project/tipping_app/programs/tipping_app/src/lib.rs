use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg");

#[program]
pub mod tipping_app {
    use super::*;

    /// Initialize a new user profile and vault
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        instructions::initialize_user::initialize_user(ctx)
    }

    /// Send a tip to another user
    pub fn send_tip(ctx: Context<SendTip>, amount: u64, message: String, tip_seed: u64) -> Result<()> {
        instructions::send_tip::send_tip(ctx, amount, message, tip_seed)
    }

    /// Withdraw accumulated tips from vault
    pub fn withdraw_tips(ctx: Context<WithdrawTips>, amount: u64) -> Result<()> {
        instructions::withdraw_tips::withdraw_tips(ctx, amount)
    }
}
