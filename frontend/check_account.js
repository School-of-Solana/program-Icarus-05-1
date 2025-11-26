import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const walletAddress = 'GeQrKuPzo7T1eJGYQhzgj6emLLBtjdyQ9hbw7WwBrBG2';
const programId = 'BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg';

async function checkAccounts() {
  const wallet = new PublicKey(walletAddress);
  
  // Check wallet balance
  const balance = await connection.getBalance(wallet);
  console.log('Wallet balance:', balance / 1e9, 'SOL');
  
  // Check if profile exists
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    new PublicKey(programId)
  );
  
  const profileInfo = await connection.getAccountInfo(profilePDA);
  console.log('Profile PDA:', profilePDA.toString());
  console.log('Profile exists:', profileInfo !== null);
  
  if (profileInfo) {
    console.log('Profile account already initialized!');
    console.log('Owner:', profileInfo.owner.toString());
  }
}

checkAccounts().catch(console.error);
