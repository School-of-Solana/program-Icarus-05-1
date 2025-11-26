"use client";

import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-semibold text-white opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  return (
    <WalletMultiButton className="!bg-gradient-to-r !from-indigo-500 !to-purple-600 hover:!from-indigo-600 hover:!to-purple-700 !rounded-lg !font-semibold !transition-all !duration-200" />
  );
}

