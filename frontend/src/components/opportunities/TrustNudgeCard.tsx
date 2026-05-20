'use client';

import { Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TrustNudgeCardProps {
  totalApplicants: number;
  verifiedApplicants: number;
}

export function TrustNudgeCard({ totalApplicants, verifiedApplicants }: TrustNudgeCardProps) {
  const verifiedPercent =
    totalApplicants > 0 ? Math.round((verifiedApplicants / totalApplicants) * 100) : 4;

  return (
    <div
      className="rounded-2xl border border-amber-200/60 dark:border-amber-700/30 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white dark:from-amber-950/20 dark:via-orange-950/10 dark:to-gray-800/80 overflow-hidden"
      role="note"
      aria-label="Verification nudge"
    >
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />

      <div className="p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
            Your match strength is unproven
          </p>

          {/* Data-driven context */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-1">
            Recruiters are reviewing{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {totalApplicants.toLocaleString()} applicants
            </span>{' '}
            for roles like yours this week.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2.5">
            Only{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {verifiedApplicants} ({verifiedPercent}%)
            </span>{' '}
            have verified reviews.{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              Those {verifiedApplicants} get contacted first.
            </span>
          </p>

          {/* Achievability framing */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            It takes one email to your manager.
          </p>

          <Link
            href="/profile#reviews"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Request a review now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
