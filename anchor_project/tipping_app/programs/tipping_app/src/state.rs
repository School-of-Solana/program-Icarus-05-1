use anchor_lang::prelude::*;

/// User profile with statistics
#[account]
pub struct UserProfile {
    pub owner: Pubkey,              // 32 bytes
    pub total_sent: u64,            // 8 bytes - total lamports sent
    pub total_received: u64,        // 8 bytes - total lamports received
    pub tips_sent_count: u64,       // 8 bytes - number of tips sent
    pub tips_received_count: u64,   // 8 bytes - number of tips received
    pub created_at: i64,            // 8 bytes - timestamp
    pub bump: u8,                   // 1 byte - PDA bump
}

impl UserProfile {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        8 + // total_sent
        8 + // total_received
        8 + // tips_sent_count
        8 + // tips_received_count
        8 + // created_at
        1; // bump
}

/// Vault to hold accumulated tips
#[account]
pub struct UserVault {
    pub owner: Pubkey,              // 32 bytes
    pub balance: u64,               // 8 bytes - lamports balance
    pub created_at: i64,            // 8 bytes
    pub bump: u8,                   // 1 byte
}

impl UserVault {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        8 + // balance
        8 + // created_at
        1; // bump
}

/// Individual tip transaction record
#[account]
pub struct TipTransaction {
    pub sender: Pubkey,             // 32 bytes
    pub receiver: Pubkey,           // 32 bytes
    pub amount: u64,                // 8 bytes
    pub message: String,            // 4 + 32 = 36 bytes (max 32 chars)
    pub timestamp: i64,             // 8 bytes
    pub tip_seed: u64,              // 8 bytes - unique seed for PDA derivation
    pub bump: u8,                   // 1 byte
}

impl TipTransaction {
    pub const LEN: usize = 8 + // discriminator
        32 + // sender
        32 + // receiver
        8 + // amount
        4 + 32 + // message (String prefix + 32 chars)
        8 + // timestamp
        8 + // tip_seed
        1; // bump
}

/// Circular buffer for recent tips
#[account]
pub struct TipHistory {
    pub owner: Pubkey,              // 32 bytes
    pub tips: Vec<TipRecord>,       // stores last 10 tips
    pub current_index: u8,          // 1 byte - circular buffer pointer
    pub bump: u8,                   // 1 byte
}

impl TipHistory {
    pub const MAX_TIPS: usize = 10;
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        4 + (Self::MAX_TIPS * TipRecord::LEN) + // tips vector
        1 + // current_index
        1; // bump

    /// Add a tip to the history (circular buffer)
    pub fn add_tip(&mut self, tip: TipRecord) {
        if self.tips.len() < Self::MAX_TIPS {
            self.tips.push(tip);
        } else {
            let index = self.current_index as usize % Self::MAX_TIPS;
            self.tips[index] = tip;
        }
        self.current_index = (self.current_index + 1) % (Self::MAX_TIPS as u8);
    }
}

/// Record of a single tip in history
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TipRecord {
    pub counterparty: Pubkey,       // 32 bytes - other person in transaction
    pub amount: u64,                // 8 bytes
    pub is_sent: bool,              // 1 byte - true if sent, false if received
    pub timestamp: i64,             // 8 bytes
}

impl TipRecord {
    pub const LEN: usize = 32 + // counterparty
        8 + // amount
        1 + // is_sent
        8; // timestamp
}

