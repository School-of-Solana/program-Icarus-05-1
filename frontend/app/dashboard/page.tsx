"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { SendTipForm } from "@/components/SendTipForm";
import { BalanceCard } from "@/components/BalanceCard";
import { StatsCard } from "@/components/StatsCard";
import { TipHistoryList } from "@/components/TipHistoryList";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Dashboard() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { isInitialized, loading } = useUserProfile();

  // Redirect to home if not connected or not initialized
  useEffect(() => {
    // Only redirect after loading completes and we're sure user is not initialized
    if (!loading && !publicKey) {
      router.replace("/");
    } else if (!loading && publicKey && !isInitialized) {
      // Small delay to prevent race condition during initialization
      const timer = setTimeout(() => {
        router.replace("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [publicKey, isInitialized, loading, router]);

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"></div>
              <h1 className="text-2xl font-bold text-gray-900">Solana Tips</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </button>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-gray-300">Manage your tips and view your transaction history</p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <SendTipForm />
            <TipHistoryList />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <BalanceCard />
            <StatsCard />
          </div>
        </div>
      </div>
    </main>
  );
}

