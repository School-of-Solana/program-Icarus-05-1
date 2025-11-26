# Solana Tipping App - Frontend

A modern, responsive frontend for the Solana Tipping dApp built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- 💸 **Quick Tips**: Send tips with pre-defined amounts (0.01, 0.05, 0.1, 0.5 SOL)
- 💬 **Messages**: Attach optional messages to tips (up to 32 characters)
- 📊 **Dashboard**: View balance, statistics, and transaction history
- 🏦 **Vault System**: Accumulate received tips and withdraw when ready
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ✨ **Modern UI**: Clean interface with gradient accents and smooth animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: 
  - @solana/web3.js
  - @coral-xyz/anchor
  - @solana/wallet-adapter-react

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Solana wallet (Phantom, Solflare, etc.)
- The Anchor program deployed (see `../anchor_project/tipping_app`)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your configuration
# NEXT_PUBLIC_SOLANA_NETWORK=devnet
# NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── WalletProvider.tsx
│   ├── WalletConnectButton.tsx
│   ├── SendTipForm.tsx
│   ├── QuickTipButtons.tsx
│   ├── BalanceCard.tsx
│   ├── StatsCard.tsx
│   └── TipHistoryList.tsx
├── hooks/                 # Custom React hooks
│   ├── useProgram.ts
│   └── useUserProfile.ts
├── lib/                   # Utility functions
│   ├── anchor-setup.ts    # Anchor/Solana setup
│   ├── utils.ts           # Helper functions
│   └── idl/              # Program IDL
│       ├── tipping_app.json
│       └── tipping_app.ts
└── public/               # Static assets
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet
NEXT_PUBLIC_PROGRAM_ID=your_program_id
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SOLANA_NETWORK`
   - `NEXT_PUBLIC_PROGRAM_ID`
4. Deploy!

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

### Netlify

```bash
# Build the project
npm run build

# Deploy
npm i -g netlify-cli
netlify deploy --prod
```

Set environment variables in your deployment platform's dashboard.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Initialize Profile**: First-time users must initialize (one-time setup)
3. **Send Tips**: Enter recipient address, amount, and optional message
4. **View Dashboard**: Check your balance, statistics, and transaction history
5. **Withdraw**: Transfer accumulated tips from vault to your wallet

## Key Components

### WalletProvider
Wraps the app with Solana wallet adapter context, enabling wallet connections.

### useProgram Hook
Provides access to the Anchor program instance and wallet context.

### useUserProfile Hook
Manages user profile state including:
- Profile data (stats, creation date)
- Vault balance
- Tip history
- Initialization status

### SendTipForm
Main tipping interface with:
- Address input with validation
- Quick-tip amount buttons
- Custom amount input
- Message field (32 char limit)
- Transaction status feedback

### Dashboard Components
- **BalanceCard**: Shows vault balance with withdraw button
- **StatsCard**: Displays total sent/received and tip counts
- **TipHistoryList**: Lists recent tips with filtering options

## Troubleshooting

### Wallet won't connect
- Ensure your wallet extension is installed and unlocked
- Try refreshing the page
- Check browser console for errors

### Transaction failing
- Ensure you have SOL for transaction fees
- Verify recipient has initialized their profile
- Check message length (max 32 characters)
- Ensure tip amount is greater than 0

### Page not loading
- Clear browser cache
- Check console for errors
- Verify environment variables are set correctly

## Contributing

This project is part of the Solana Bootcamp program. For issues or suggestions, please refer to the main project README.

## License

MIT
