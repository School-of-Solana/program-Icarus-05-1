import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const walletAddress = 'GeQrKuPzo7T1eJGYQhzgj6emLLBtjdyQ9hbw7WwBrBG2';
const programId = 'BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg';

async function checkTipAccounts() {
  const wallet = new PublicKey(walletAddress);
  const program = new PublicKey(programId);
  
  // Check profile
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_profile'), wallet.toBuffer()],
    program
  );
  
  const profileInfo = await connection.getAccountInfo(profilePDA);
  if (profileInfo) {
    // Parse the profile data (simplified - just check if it exists)
    console.log('Profile exists');
    
    // Try to find existing tip transactions
    for (let i = 1; i <= 5; i++) {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, BigInt(i), true);
      const tipIndexBuffer = Buffer.from(buffer);
      
      const [tipPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('tip'),
          wallet.toBuffer(),
          tipIndexBuffer,
        ],
        program
      );
      
      const tipInfo = await connection.getAccountInfo(tipPDA);
      if (tipInfo) {
        console.log(`Tip transaction ${i} EXISTS at: ${tipPDA.toString()}`);
      } else {
        console.log(`Tip transaction ${i} does NOT exist`);
      }
    }
  }
}

checkTipAccounts().catch(console.error);
