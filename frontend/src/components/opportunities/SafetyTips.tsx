"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

export function SafetyTips() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Safety Tips</h3>
      </div>
      <ul className="space-y-3">
        <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span>Never pay money to apply for a job or opportunity</span>
        </li>
        <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span>Meet in public places for interviews when possible</span>
        </li>
        <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span>Verify the company&apos;s legitimacy before sharing documents</span>
        </li>
        <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span>Research the organization online and check reviews</span>
        </li>
      </ul>
      <button className="mt-4 flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline">
        <ShieldAlert size={14} />
        Report if suspicious
      </button>
    </div>
  );
}
