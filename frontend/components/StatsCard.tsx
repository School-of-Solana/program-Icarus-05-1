"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { formatSol } from "@/lib/utils";

export function StatsCard() {
  const { profile } = useUserProfile();

  if (!profile) {
    return null;
  }

  const stats = [
    {
      label: "Total Sent",
      value: `${formatSol(Number(profile.totalSent))} SOL`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Total Received",
      value: `${formatSol(Number(profile.totalReceived))} SOL`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
        </svg>
      ),
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Tips Sent",
      value: profile.tipsSentCount.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Tips Received",
      value: profile.tipsReceivedCount.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-sm font-medium text-gray-300">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-white ml-11">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

