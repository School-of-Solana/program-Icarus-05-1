"use client";

import { useMemo, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatSol, shortenAddress, formatRelativeTime } from "@/lib/utils";

type FilterType = "all" | "sent" | "received";

export function TipHistoryList() {
  const { history } = useUserProfile();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTips = useMemo(() => {
    if (!history || !history.tips) return [];
    
    return history.tips.filter((tip) => {
      if (filter === "sent") return tip.isSent;
      if (filter === "received") return !tip.isSent;
      return true;
    });
  }, [history, filter]);

  if (!history) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Recent Tips</h2>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(["all", "sent", "received"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-all duration-200 ${
                filter === f
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTips.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-400">No tips yet</p>
          <p className="text-gray-500 text-sm mt-1">
            {filter === "sent" && "You haven't sent any tips yet"}
            {filter === "received" && "You haven't received any tips yet"}
            {filter === "all" && "Start by sending your first tip!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTips.map((tip, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:shadow-md transition-all duration-200"
            >
              {/* Icon */}
              <div className={`p-3 rounded-full ${tip.isSent ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {tip.isSent ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
                  </svg>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">
                  {tip.isSent ? "Sent to" : "Received from"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {shortenAddress(tip.counterparty.toString())}
                </p>
              </div>

              {/* Amount & Time */}
              <div className="text-right">
                <p className={`font-bold ${tip.isSent ? "text-red-400" : "text-green-400"}`}>
                  {tip.isSent ? "-" : "+"}{formatSol(Number(tip.amount))} SOL
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(Number(tip.timestamp))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

