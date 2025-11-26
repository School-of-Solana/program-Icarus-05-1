"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { useProgram } from "@/hooks/useProgram";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateTipSeed } from "@/lib/anchor-setup";
import { solToLamports } from "@/lib/utils";
import { QuickTipButtons } from "./QuickTipButtons";

export function SendTipForm() {
  const { program, wallet } = useProgram();
  const { profile, refreshUserData } = useUserProfile();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendTip = async () => {
    if (!program || !wallet.publicKey || !profile) {
      setError("Please connect your wallet and initialize your profile");
      return;
    }

    if (!recipient) {
      setError("Please enter a recipient address");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please select or enter a valid tip amount");
      return;
    }

    if (message.length > 32) {
      setError("Message must be 32 characters or less");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Parse recipient public key
      const receiverPubkey = new PublicKey(recipient);
      
      // Generate a unique tip seed based on current timestamp
      // This eliminates race conditions - each tip has a unique seed
      const tipSeed = generateTipSeed();
      
      console.log("Generated tip seed:", tipSeed.toString());

      // Convert amount to lamports
      const amountLamports = new BN(solToLamports(amount));

      // Send transaction with better error handling
      // Anchor auto-derives all PDAs from sender, receiver, and tip_seed
      let tx;
      try {
        tx = await program.methods
          .sendTip(amountLamports, message, new BN(tipSeed.toString()))
          .accounts({
            sender: wallet.publicKey,
            receiver: receiverPubkey,
          })
          .rpc();
      } catch (txError: any) {
        // Check if it's a user rejection
        if (txError?.name === "WalletSignTransactionError" || 
            txError?.message?.includes("User rejected") ||
            txError?.message?.includes("user rejected")) {
          // User cancelled - don't show as error, just return early
          setLoading(false);
          return;
        }
        // Re-throw other errors to be handled below
        throw txError;
      }

      if (tx) {
        console.log("Tip sent successfully! Tx:", tx);
        
        // Reset form
        setRecipient("");
        setAmount(null);
        setMessage("");
        setSuccess(true);
        
        // Wait for transaction confirmation before refreshing data
        // This ensures the on-chain state is updated
        try {
          await program.provider.connection.confirmTransaction(tx, "confirmed");
        } catch (confirmErr) {
          console.warn("Transaction confirmation check failed, but tx was submitted:", confirmErr);
        }
        
        // Small delay to ensure state propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh user data
        await refreshUserData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      // Skip logging user rejections (they're expected)
      if (err?.name !== "WalletSignTransactionError" && 
          !err?.message?.includes("User rejected") &&
          !err?.message?.includes("user rejected")) {
        console.error("Error sending tip:", err);
      }
      
      // Handle user rejection gracefully - don't show as error
      if (err?.name === "WalletSignTransactionError" || 
          err?.message?.includes("User rejected") ||
          err?.message?.includes("user rejected")) {
        // User cancelled - just reset loading state, no error message
        setLoading(false);
        return;
      } else if (err?.message?.includes("AccountNotInitialized")) {
        setError("Recipient hasn't initialized their profile yet. They need to create an account first.");
      } else if (err?.message?.includes("InsufficientFunds")) {
        setError("You don't have enough SOL to send this tip. Please check your balance.");
      } else if (err?.message?.includes("MessageTooLong")) {
        setError("Message is too long. Maximum 32 characters allowed.");
      } else if (err?.message?.includes("InvalidAmount")) {
        setError("Tip amount must be greater than zero.");
      } else if (err?.message?.includes("InvalidTipSeed")) {
        setError("Transaction expired. Please try again.");
      } else {
        const errorMessage = err instanceof Error ? err.message : "Failed to send tip";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6 border border-gray-700">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Send a Tip</h2>
        <p className="text-gray-400">Send SOL to any address with an optional message</p>
      </div>

      {/* Recipient Address */}
      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Address
        </label>
        <input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter Solana wallet address"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          disabled={loading}
        />
      </div>

      {/* Quick Tip Amounts */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Tip Amounts
        </label>
        <QuickTipButtons
          selectedAmount={amount}
          onSelect={setAmount}
        />
      </div>

      {/* Custom Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Or Enter Custom Amount (SOL)
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount ?? ""}
          onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          disabled={loading}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Message (Optional, max 32 characters)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message to your tip..."
          maxLength={32}
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
          disabled={loading}
        />
        <p className="text-sm text-gray-400 mt-1">
          {message.length}/32 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-300 text-sm font-medium">Tip sent successfully!</p>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSendTip}
        disabled={loading || !wallet.publicKey || !profile}
        className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : (
          "Send Tip"
        )}
      </button>
    </div>
  );
}

