import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { TippingApp } from "./idl/tipping_app";
import idl from "./idl/tipping_app.json";

// Program ID from the deployed program
export const PROGRAM_ID = new PublicKey("BHv63VgDSZCbiPDDnZigyvbhVc8gSKV4WVaM2LusnyXg");

// Network endpoints
export const ENDPOINTS = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
  localhost: "http://localhost:8899",
};

export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as keyof typeof ENDPOINTS;
export const ENDPOINT = ENDPOINTS[NETWORK];

// Get Anchor program instance
export function getProgram(wallet: AnchorWallet, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
  
  return new Program<TippingApp>(idl as TippingApp, provider);
}

// Derive PDA addresses
export function getUserProfilePDA(userPubkey: PublicKey, programId: PublicKey = PROGRAM_ID): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), userPubkey.toBuffer()],
    programId
  );
  return pda;
}

export function getUserVaultPDA(userPubkey: PublicKey, programId: PublicKey = PROGRAM_ID): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_vault"), userPubkey.toBuffer()],
    programId
  );
  return pda;
}

export function getTipHistoryPDA(userPubkey: PublicKey, programId: PublicKey = PROGRAM_ID): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tip_history"), userPubkey.toBuffer()],
    programId
  );
  return pda;
}

export function getTipTransactionPDA(
  senderPubkey: PublicKey,
  tipSeed: number | bigint,
  programId: PublicKey = PROGRAM_ID
): PublicKey {
  // Convert tipSeed to u64 little-endian bytes (8 bytes)
  // Create a DataView to write the BigInt as little-endian
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(tipSeed), true); // true = little endian
  const tipSeedBuffer = Buffer.from(buffer);
  
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("tip"),
      senderPubkey.toBuffer(),
      tipSeedBuffer,
    ],
    programId
  );
  return pda;
}

// Generate a unique tip seed based on current Unix timestamp
// The program validates that tip_seed is within 5 minutes of current time (in seconds)
export function generateTipSeed(): bigint {
  // Get current Unix timestamp in seconds
  const timestampSeconds = Math.floor(Date.now() / 1000);
  // Return as BigInt - this will be validated by the program to be within ±5 minutes
  return BigInt(timestampSeconds);
}

