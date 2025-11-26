"use client";

import { QUICK_TIP_AMOUNTS } from "@/lib/utils";

interface QuickTipButtonsProps {
  onSelect: (amount: number) => void;
  selectedAmount: number | null;
}

export function QuickTipButtons({ onSelect, selectedAmount }: QuickTipButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_TIP_AMOUNTS.map((amount) => (
        <button
          key={amount}
          onClick={() => onSelect(amount)}
          className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
            selectedAmount === amount
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-indigo-400 hover:shadow-md"
          }`}
        >
          {amount} SOL
        </button>
      ))}
    </div>
  );
}

