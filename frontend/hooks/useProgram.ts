"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/anchor-setup";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }

    const anchorWallet: AnchorWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet),
      signAllTransactions: wallet.signAllTransactions.bind(wallet),
    };

    return getProgram(anchorWallet, connection);
  }, [wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions, connection]);

  return { program, wallet, connection };
}

