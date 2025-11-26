# Project Description

**Deployed Frontend URL:** https://soulful-hu8bqr350-icarus05s-projects.vercel.app

**Solana Program ID:** `BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg` (Deployed on Devnet)

## Project Overview

### Description

A decentralized tipping application built on Solana that enables users to send SOL tips to any wallet address with optional messages. The app features a comprehensive vault system where users receive tips, detailed transaction history tracking, and real-time statistics. Users can send tips using quick-select buttons (0.01, 0.05, 0.1, 0.5 SOL) or custom amounts, attach messages up to 32 characters, view their complete tip history (last 10 transactions), and withdraw accumulated tips from their personal vault.

### Key Features

- **Initialize User Profile**: Create a personal profile with vault and transaction history tracking
- **Send Tips with Messages**: Transfer SOL to any address with optional 32-character messages
- **Quick Tip Buttons**: Pre-defined amount buttons for fast tipping (0.01, 0.05, 0.1, 0.5 SOL)
- **Personal Vault System**: Received tips accumulate in a secure PDA vault
- **Withdraw Functionality**: Transfer accumulated tips from vault to personal wallet
- **Transaction History**: View last 10 tips (sent/received) with filtering options
- **Real-time Statistics**: Track total sent, total received, and tip counts
- **Modern UI/UX**: Sleek, responsive interface with gradient accents and smooth animations
  
### How to Use the dApp

1. **Connect Wallet** - Click "Connect Wallet" and select your Solana wallet (Phantom, Solflare, etc.)
2. **Initialize Profile** - First-time users must initialize their profile (creates profile, vault, and history PDAs)
3. **Send a Tip:**
   - Enter the recipient's Solana wallet address
   - Select a quick-tip amount or enter a custom amount
   - Optionally add a message (max 32 characters)
   - Click "Send Tip" and approve the transaction
4. **View Dashboard:** Navigate to the dashboard to see:
   - Your vault balance (accumulated received tips)
   - Statistics (total sent/received, tip counts)
   - Recent transaction history with filter options
5. **Withdraw Tips:** Click "Withdraw All" on the balance card to transfer tips from vault to wallet

## Program Architecture

The Solana program is built using the Anchor framework and implements a comprehensive tipping system with user profiles, vaults, transaction records, and history tracking.

### PDA Usage

The program uses four types of Program Derived Addresses (PDAs) to manage user data and transactions:

**PDAs Used:**
1. **User Profile PDA**
   - Seeds: `["user_profile", user_pubkey]`
   - Purpose: Stores user statistics and metadata
   - Data: owner, total_sent, total_received, tips_sent_count, tips_received_count, created_at, bump

2. **User Vault PDA**
   - Seeds: `["user_vault", user_pubkey]`
   - Purpose: Holds accumulated tips awaiting withdrawal
   - Data: owner, balance (in lamports), created_at, bump

3. **Tip History PDA**
   - Seeds: `["tip_history", user_pubkey]`
   - Purpose: Stores circular buffer of last 10 tips for quick access
   - Data: owner, tips (Vec of TipRecord), current_index, bump

4. **Tip Transaction PDA**
   - Seeds: `["tip", sender_pubkey, tip_seed_bytes]`
   - Purpose: Records individual tip transactions on-chain (unique per timestamp-based seed)
   - Data: sender, receiver, amount, message, timestamp, tip_seed, bump

### Program Instructions

**Instructions Implemented:**

1. **initialize_user**
   - Creates UserProfile, UserVault, and TipHistory PDAs for a new user
   - Sets initial balances and counts to zero
   - Records creation timestamp
   - All PDAs are derived from the user's public key

2. **send_tip**
   - Validates tip amount (must be > 0) and message length (≤ 32 chars)
   - Checks sender has sufficient funds
   - Transfers SOL from sender to receiver's vault PDA
   - Creates a TipTransaction PDA to record the transaction
   - Updates both sender and receiver profiles (statistics)
   - Updates both users' tip history (circular buffer)
   - Emits TipSent event for indexing
   - Requires both sender and receiver to have initialized profiles

3. **withdraw_tips**
   - Validates withdrawal amount (must be > 0 and ≤ vault balance)
   - Ensures vault account remains rent-exempt after withdrawal
   - Transfers lamports from user's vault PDA to their wallet
   - Updates vault balance
   - Emits WithdrawEvent for tracking
   - Only the vault owner can withdraw

### Account Structure

```rust
// User profile with statistics
#[account]
pub struct UserProfile {
    pub owner: Pubkey,              // User's wallet address
    pub total_sent: u64,            // Total lamports sent
    pub total_received: u64,        // Total lamports received
    pub tips_sent_count: u64,       // Number of tips sent
    pub tips_received_count: u64,   // Number of tips received
    pub created_at: i64,            // Unix timestamp
    pub bump: u8,                   // PDA bump seed
}

// Vault to hold accumulated tips
#[account]
pub struct UserVault {
    pub owner: Pubkey,              // Vault owner
    pub balance: u64,               // Lamports balance
    pub created_at: i64,            // Unix timestamp
    pub bump: u8,                   // PDA bump seed
}

// Individual tip transaction record
#[account]
pub struct TipTransaction {
    pub sender: Pubkey,             // Sender's address
    pub receiver: Pubkey,           // Receiver's address
    pub amount: u64,                // Tip amount in lamports
    pub message: String,            // Optional message (max 32 chars)
    pub timestamp: i64,             // Unix timestamp
    pub tip_seed: u64,              // Unique timestamp-based seed for PDA derivation
    pub bump: u8,                   // PDA bump seed
}

// Circular buffer for recent tips
#[account]
pub struct TipHistory {
    pub owner: Pubkey,              // History owner
    pub tips: Vec<TipRecord>,       // Last 10 tips (circular buffer)
    pub current_index: u8,          // Pointer for circular buffer
    pub bump: u8,                   // PDA bump seed
}

// Record of a single tip in history
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TipRecord {
    pub counterparty: Pubkey,       // Other party (sender if received, receiver if sent)
    pub amount: u64,                // Tip amount in lamports
    pub is_sent: bool,              // true = sent, false = received
    pub timestamp: i64,             // Unix timestamp
}
```

## Testing

### Test Coverage

Comprehensive test suite with 14 tests covering all program instructions and edge cases.

**Happy Path Tests:**
1. **Initialize User (Alice)**: Successfully creates profile, vault, and history with correct initial values
2. **Initialize User (Bob)**: Verifies multiple users can initialize independently
3. **Alice sends tip to Bob with message**: Transfers SOL, updates profiles, records transaction, updates histories
4. **Alice sends another tip to Bob (no message)**: Validates multiple tips work correctly
5. **Bob withdraws tips**: Successfully transfers all accumulated tips from vault to wallet
6. **Quick-tip amounts test**: Verifies all pre-defined amounts (0.01, 0.05, 0.1, 0.5 SOL) work correctly
7. **Self-tipping test**: Verifies that sending a tip to yourself correctly updates both sent and received counts

**Unhappy Path Tests:**
8. **Initialize duplicate**: Fails with "already in use" when trying to initialize twice
9. **Send tip with zero amount**: Correctly rejects with InvalidAmount error
10. **Send tip with message too long**: Rejects messages longer than 32 characters with MessageTooLong error
11. **Withdraw from empty vault**: Fails with VaultEmpty error when vault balance is 0
12. **Unauthorized withdrawal**: Prevents users from withdrawing from another user's vault with Unauthorized/seeds constraint error
13. **Insufficient funds**: Correctly handles cases where sender doesn't have enough SOL with InsufficientFunds error
14. **Invalid tip_seed (too old)**: Rejects transactions with tip_seed more than 5 minutes old (replay attack protection)

### Running Tests

```bash
# Navigate to anchor project
cd anchor_project/tipping_app

# Run all tests
anchor test

# Run tests with detailed output
anchor test -- --nocapture
```

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet Integration**: @solana/wallet-adapter-react
- **Blockchain**: @solana/web3.js, @coral-xyz/anchor
- **State Management**: React hooks with custom hooks for program interaction

### Components
- **WalletProvider**: Wallet adapter context provider
- **WalletConnectButton**: Styled wallet connection button
- **SendTipForm**: Main tipping interface with quick-tip buttons and custom amounts
- **QuickTipButtons**: Pre-defined amount selection (0.01, 0.05, 0.1, 0.5 SOL)
- **BalanceCard**: Displays vault balance with withdraw functionality
- **StatsCard**: Shows user statistics (total sent/received, tip counts)
- **TipHistoryList**: Displays last 10 tips with filter options

### Pages
- **Home (/)**: Landing page with wallet connection and profile initialization
- **Dashboard (/dashboard)**: Main application interface with all features

## Deployment Instructions

### Deploy Anchor Program to Devnet

```bash
# Navigate to anchor project
cd anchor_project/tipping_app

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update program ID in:
# - Anchor.toml
# - programs/tipping_app/src/lib.rs
# - frontend/lib/anchor-setup.ts

# Run tests on devnet
anchor test --provider.cluster devnet
```

### Deploy Frontend

#### Option 1: Vercel (Recommended)

```bash
# Navigate to frontend
cd frontend

# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SOLANA_NETWORK=devnet
# NEXT_PUBLIC_PROGRAM_ID=<your_program_id>
```

#### Option 2: Netlify

```bash
# Navigate to frontend
cd frontend

# Build the project
npm run build

# Install Netlify CLI (if not installed)
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

#### Local Development

```bash
# Navigate to frontend
cd frontend

# Create .env.local file with:
# NEXT_PUBLIC_SOLANA_NETWORK=devnet
# NEXT_PUBLIC_PROGRAM_ID=BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Key Implementation Details

### Circular Buffer for Tip History
- Stores only last 10 tips per user to optimize account size and rent costs
- Uses modulo arithmetic: `index = (current_index + 1) % 10`
- Automatically overwrites oldest tip when buffer is full
- Tracks both sent and received tips in the same buffer

### Security Features
- All mutable operations require signer verification
- PDA seed validation ensures accounts can't be spoofed
- Vault ownership checks prevent unauthorized withdrawals
- Arithmetic overflow protection on all balance operations
- Rent-exempt checks ensure accounts remain valid
- Message length validation (max 32 characters)
- Amount validation (must be > 0)

### Rent Optimization
- UserProfile: ~81 bytes (rent-exempt)
- UserVault: ~57 bytes (rent-exempt)
- TipHistory: ~508 bytes (10 tips, rent-exempt)
- TipTransaction: ~133 bytes (rent-exempt)
- All PDAs are sized appropriately to minimize rent costs

### Error Handling
- Custom error codes for all failure scenarios
- Frontend displays user-friendly error messages
- Transaction retry logic for network issues
- Loading states for all async operations

## Additional Notes for Evaluators

This was an interesting challenge implementing a complete dApp from scratch! Key learnings included:

1. **PDA Design**: Using multiple PDAs per user (profile, vault, history) provides better separation of concerns and allows for more efficient updates.

2. **Circular Buffer**: The tip history circular buffer was a great optimization - stores recent activity while keeping account size manageable.

3. **Testing**: Writing comprehensive tests (both happy and unhappy paths) helped catch edge cases early, especially around authorization and balance checks.

4. **Frontend Integration**: The Anchor client makes program interaction straightforward, but managing account initialization and PDAs required careful handling.

5. **UI/UX**: Focused on making the interface clean and intuitive with clear feedback for all actions (loading states, success/error messages).

The program is deployed on **Solana Devnet** with Program ID `BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg`. All 14 tests pass successfully, covering initialization, tipping, withdrawals, self-tipping, and error cases including replay attack protection via timestamp-based tip seeds.
