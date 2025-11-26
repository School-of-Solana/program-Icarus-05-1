use anchor_lang::prelude::*;

#[error_code]
pub enum TippingError {
    #[msg("Insufficient funds to send tip")]
    InsufficientFunds,
    
    #[msg("Message exceeds maximum length of 32 characters")]
    MessageTooLong,
    
    #[msg("Tip amount must be greater than zero")]
    InvalidAmount,
    
    #[msg("Vault is empty, nothing to withdraw")]
    VaultEmpty,
    
    #[msg("Unauthorized: You do not have permission to perform this action")]
    Unauthorized,
    
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,
    
    #[msg("Invalid tip seed: must be within 5 minutes of current time")]
    InvalidTipSeed,
}

