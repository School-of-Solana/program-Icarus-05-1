"use client";

import { useState } from "react";
import { BN } from "bn.js";
import { useProgram } from "@/hooks/useProgram";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatSol } from "@/lib/utils";

export function BalanceCard() {
  const { program, wallet } = useProgram();
  const { vault, refreshUserData } = useUserProfile();
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleWithdraw = async () => {
    if (!program || !wallet.publicKey || !vault) {
      setError("Wallet not connected or vault not found");
      return;
    }

    if (vault.balance === BigInt(0)) {
      setError("No balance to withdraw");
      return;
    }

    setWithdrawing(true);
    setError(null);
    setSuccess(false);

    try {
      const withdrawAmount = new BN(vault.balance.toString());

      // Anchor auto-derives userVault PDA from user
      const tx = await program.methods
        .withdrawTips(withdrawAmount)
        .accounts({
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Withdrawal successful! Tx:", tx);
      setSuccess(true);
      
      // Refresh user data
      await refreshUserData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error withdrawing:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to withdraw";
      setError(errorMessage);
    } finally {
      setWithdrawing(false);
    }
  };

  if (!vault) {
    return null;
  }

  const balanceSol = Number(vault.balance) / 1e9;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Vault Balance</h2>
        <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      
      <div className="mb-6">
        <p className="text-white/80 text-sm mb-1">Available to Withdraw</p>
        <p className="text-4xl md:text-5xl font-bold">
          {formatSol(Number(vault.balance), 4)} <span className="text-2xl">SOL</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-300/30 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-300/30 rounded-lg">
          <p className="text-sm font-medium">Withdrawal successful!</p>
        </div>
      )}

      <button
        onClick={handleWithdraw}
        disabled={withdrawing || balanceSol === 0}
        className="w-full py-3 px-6 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {withdrawing ? "Withdrawing..." : "Withdraw All"}
      </button>
    </div>
  );
}

