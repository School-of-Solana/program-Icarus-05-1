"use client";

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { getUserProfilePDA, getUserVaultPDA, getTipHistoryPDA } from "@/lib/anchor-setup";

export interface UserProfileData {
  owner: PublicKey;
  totalSent: bigint;
  totalReceived: bigint;
  tipsSentCount: bigint;
  tipsReceivedCount: bigint;
  createdAt: bigint;
  bump: number;
}

export interface UserVaultData {
  owner: PublicKey;
  balance: bigint;
  createdAt: bigint;
  bump: number;
}

export interface TipRecord {
  counterparty: PublicKey;
  amount: bigint;
  isSent: boolean;
  timestamp: bigint;
}

export interface TipHistoryData {
  owner: PublicKey;
  tips: TipRecord[];
  currentIndex: number;
  bump: number;
}

export function useUserProfile() {
  const { program, wallet } = useProgram();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [vault, setVault] = useState<UserVaultData | null>(null);
  const [history, setHistory] = useState<TipHistoryData | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading = true
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user profile, vault, and history
  const fetchUserData = async () => {
    if (!program || !wallet.publicKey) {
      setProfile(null);
      setVault(null);
      setHistory(null);
      setIsInitialized(false);
      setLoading(false); // Make sure to set loading = false
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profilePDA = getUserProfilePDA(wallet.publicKey);
      const vaultPDA = getUserVaultPDA(wallet.publicKey);
      const historyPDA = getTipHistoryPDA(wallet.publicKey);

      const [profileData, vaultData, historyData] = await Promise.all([
        program.account.userProfile.fetch(profilePDA, "confirmed").catch(() => null),
        program.account.userVault.fetch(vaultPDA, "confirmed").catch(() => null),
        program.account.tipHistory.fetch(historyPDA, "confirmed").catch(() => null),
      ]);

      if (profileData && vaultData) {
        setProfile(profileData as unknown as UserProfileData);
        setVault(vaultData as unknown as UserVaultData);
        setHistory(historyData as unknown as TipHistoryData);
        setIsInitialized(true);
      } else {
        setProfile(null);
        setVault(null);
        setHistory(null);
        setIsInitialized(false);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  // Initialize user
  const initializeUser = async () => {
    if (!program || !wallet.publicKey || !program.provider.connection) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      // Check wallet balance before attempting initialization
      const balance = await program.provider.connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / 1e9;
      
      // Calculate approximate rent required for 3 accounts
      // UserProfile: ~81 bytes, UserVault: ~57 bytes, TipHistory: ~536 bytes
      // Rent-exempt minimum is roughly 0.00089 SOL per KB per year, minimum ~0.00089 SOL for small accounts
      // Plus transaction fees (~0.000005 SOL)
      // We'll require at least 0.002 SOL to be safe
      const MIN_REQUIRED_SOL = 0.002;
      
      if (balanceSOL < MIN_REQUIRED_SOL) {
        const errorMsg = `Insufficient SOL balance. You need at least ${MIN_REQUIRED_SOL} SOL to initialize your profile. Current balance: ${balanceSOL.toFixed(4)} SOL. Please add SOL to your wallet and try again.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      const tx = await program.methods
        .initializeUser()
        .accounts({
          user: wallet.publicKey,
        })
        .rpc();

      console.log("User initialized, tx:", tx);
      
      // Wait for transaction confirmation before fetching data
      // This ensures the accounts are created and available
      await program.provider.connection.confirmTransaction(tx, "confirmed");
      
      // Small delay to ensure account data is available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data with confirmed commitment to ensure we get the latest state
      await fetchUserData();
      
      return tx;
    } catch (err: any) {
      console.error("Error initializing user:", err);
      
      // Extract detailed error message
      let errorMessage = "Failed to initialize profile";
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.logs) {
        // Try to extract error from logs
        const logString = Array.isArray(err.logs) ? err.logs.join(" ") : String(err.logs);
        if (logString.includes("insufficient funds") || logString.includes("InsufficientFunds")) {
          errorMessage = "Insufficient SOL balance. You need at least 0.002 SOL to initialize your profile. Please add SOL to your wallet and try again.";
        } else if (logString.includes("Attempt to debit")) {
          errorMessage = "Insufficient SOL balance. Your wallet doesn't have enough SOL to pay for account creation. Please add at least 0.002 SOL and try again.";
        } else {
          errorMessage = `Initialization failed: ${logString}`;
        }
      } else if (err?.toString) {
        const errString = err.toString();
        if (errString.includes("insufficient funds") || errString.includes("InsufficientFunds") || errString.includes("Attempt to debit")) {
          errorMessage = "Insufficient SOL balance. You need at least 0.002 SOL to initialize your profile. Please add SOL to your wallet and try again.";
        } else {
          errorMessage = errString;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when wallet or program changes
  useEffect(() => {
    // Only fetch if both program and wallet are ready
    if (program && wallet.publicKey) {
      fetchUserData();
    } else if (!wallet.publicKey) {
      // Reset state when wallet disconnects
      setProfile(null);
      setVault(null);
      setHistory(null);
      setIsInitialized(false);
      setLoading(false);
    } else if (wallet.publicKey && !program) {
      // Wallet is connected but program isn't ready yet
      // Keep loading = true but add a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        // If program still isn't ready after 5 seconds, stop loading
        // This handles edge cases where wallet adapter is slow
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [program, wallet.publicKey]);

  return {
    profile,
    vault,
    history,
    loading,
    error,
    isInitialized,
    initializeUser,
    refreshUserData: fetchUserData,
  };
}

