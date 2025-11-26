"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Home() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { isInitialized, initializeUser, loading, error } = useUserProfile();
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-navigate to dashboard when initialization completes
  useEffect(() => {
    if (isInitialized && !loading && publicKey) {
      setIsInitializing(false); // Reset initialization flag
      router.push("/dashboard");
    }
  }, [isInitialized, loading, publicKey, router]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initializeUser();
      // The useEffect above will handle navigation when isInitialized becomes true
    } catch (error) {
      console.error("Failed to initialize user:", error);
      // Error is already set in useUserProfile hook, so it will be displayed
      setIsInitializing(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Solana Tips</h1>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Send Tips on{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Solana
            </span>
          </h2>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A decentralized tipping application. Send SOL to anyone with optional messages and track your entire transaction history on-chain.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-200">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Quick Tips</h3>
              <p className="text-sm text-gray-400">Send tips with pre-defined amounts or custom values</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Add Messages</h3>
              <p className="text-sm text-gray-400">Attach personal messages to your tips (up to 32 chars)</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-200">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Track History</h3>
              <p className="text-sm text-gray-400">View all your sent and received tips with statistics</p>
            </div>
          </div>

          {/* CTA */}
          {!publicKey ? (
            <div className="max-w-md mx-auto">
              <WalletConnectButton />
              <p className="text-sm text-gray-500 mt-4">
                Connect your Solana wallet to get started
          </p>
        </div>
          ) : loading && !isInitializing ? (
            // Show loading while checking if user is initialized
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Checking profile...</p>
              </div>
            </div>
          ) : !isInitialized ? (
            <div className="max-w-md mx-auto space-y-4">
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={handleInitialize}
                disabled={loading || isInitializing}
                className="w-full py-4 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading || isInitializing ? "Initializing..." : "Initialize Your Profile"}
              </button>
              <p className="text-sm text-gray-500">
                Create your profile and vault to start tipping. You'll need at least 0.002 SOL for account creation.
              </p>
            </div>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="py-4 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Built on Solana with Anchor Framework</p>
      </footer>
      </main>
  );
}
