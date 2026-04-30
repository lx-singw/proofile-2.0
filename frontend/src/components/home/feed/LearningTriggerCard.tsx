'use client';

import { useState } from 'react';
import { Sparkles, MapPin, DollarSign, LogIn, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { InferredProfile } from '@/types/feedCard';

interface LearningTriggerCardProps {
  inferredProfile: InferredProfile;
  onConfirm: (accepted: boolean) => void;
}

function formatSalaryRange(min: number, max: number, currency: string): string {
  if (!min && !max) return '';
  const fmt = (n: number) =>
    currency === 'ZAR' ? `R${Math.round(n / 1000)}k` : `$${Math.round(n / 1000)}k`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/month`;
  if (min) return `${fmt(min)}/month`;
  return '';
}

export function LearningTriggerCard({ inferredProfile, onConfirm }: LearningTriggerCardProps) {
  const [adjusting, setAdjusting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const salaryLabel = formatSalaryRange(
    inferredProfile.salaryMin,
    inferredProfile.salaryMax,
    inferredProfile.salaryCurrency,
  );

  if (dismissed) return null;

  return (
    <div
      className="rounded-2xl border border-indigo-200/60 dark:border-indigo-700/30 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-gray-800/80 overflow-hidden shadow-sm"
      role="status"
      aria-label="Feed learning your preferences"
    >
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
              We&apos;re learning your taste
            </p>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Based on what you&apos;ve browsed, you seem to be interested in:
            </h4>
          </div>
        </div>

        {/* Inferred profile summary */}
        <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 border border-indigo-100/60 dark:border-indigo-800/30 p-3 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <span className="text-indigo-500">◆</span>
            {inferredProfile.role} roles
          </div>
          {inferredProfile.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              {inferredProfile.location}
            </div>
          )}
          {salaryLabel && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              {salaryLabel}
            </div>
          )}
          {inferredProfile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {inferredProfile.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand: adjust preferences */}
        {adjusting && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/20 p-3 mb-4">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Sign in to set your preferences precisely — or keep browsing and we&apos;ll keep learning.
            </p>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              onConfirm(true);
              setDismissed(true);
            }}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-indigo-500/25 transition-all active:scale-[0.98]"
          >
            Yes, keep going ✓
          </button>
          <button
            onClick={() => {
              setAdjusting((v) => !v);
              if (!adjusting) onConfirm(false);
            }}
            className="flex items-center justify-center gap-1 py-2.5 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            No, adjust
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adjusting ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Secondary CTA: sign in */}
        <div className="mt-3 pt-3 border-t border-indigo-100/50 dark:border-indigo-800/20 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Sign in to save this + get your real match strength on every card
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in free →
          </Link>
        </div>
      </div>
    </div>
  );
}
