"use client";

import { AlertTriangle, ThumbsUp } from "lucide-react";
import { useState } from "react";

interface VouchSectionProps {
  opportunityId: number;
  vouchPositive?: number;
  vouchNegative?: number;
}

export function VouchSection({ opportunityId, vouchPositive = 0, vouchNegative = 0 }: VouchSectionProps) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleVouch = (type: 'positive' | 'negative') => {
    showToast(`Login to vouch for this opportunity`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <ThumbsUp className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Community Vouches</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-500">{vouchPositive}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Positive</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-red-500">{vouchNegative}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Negative</p>
          </div>
          <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
            <p>Community members have vouched for this opportunity.</p>
            <p className="mt-1 text-xs">Vouches help others know if an opportunity is legitimate.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleVouch('positive')}
            className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <ThumbsUp size={16} />
            Vouch (Legit)
          </button>
          <button 
            onClick={() => handleVouch('negative')}
            className="flex-1 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <AlertTriangle size={16} />
            Report (Suspicious)
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Your vouch helps the community identify trustworthy opportunities.
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
