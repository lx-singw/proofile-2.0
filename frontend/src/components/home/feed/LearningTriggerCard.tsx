'use client';

import { useState } from 'react';
import { Sparkles, MapPin, DollarSign, LogIn, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { InferredProfile } from '@/types/feedCard';

interface LearningTriggerCardProps {
  inferredProfile: InferredProfile;
  onConfirm: (accepted: boolean) => void;
  engagedCount?: number;
}

function formatSalaryRange(min: number, max: number, currency: string): string {
  if (!min && !max) return '';
  const fmt = (n: number) =>
    currency === 'ZAR' ? `R${Math.round(n / 1000)}k` : `$${Math.round(n / 1000)}k`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}/month`;
  if (min) return `${fmt(min)}/month`;
  return '';
}

const ROLE_OPTIONS = [
  'Software Developer', 'Data Scientist', 'Product Manager',
  'Designer', 'DevOps Engineer', 'QA Engineer',
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
];

const LOCATION_OPTIONS = [
  'Johannesburg', 'Cape Town', 'Durban', 'Pretoria',
  'Port Elizabeth', 'Bloemfontein', 'Remote', 'Hybrid',
];

export function LearningTriggerCard({ inferredProfile, onConfirm, engagedCount = 5 }: LearningTriggerCardProps) {
  const [adjusting, setAdjusting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [adjustedRole, setAdjustedRole] = useState(inferredProfile.role);
  const [adjustedLocation, setAdjustedLocation] = useState(inferredProfile.location);
  const [adjustedSalaryMin, setAdjustedSalaryMin] = useState(inferredProfile.salaryMin);
  const [adjustedSalaryMax, setAdjustedSalaryMax] = useState(inferredProfile.salaryMax);

  // Confidence grows with more engaged cards: 60% base + up to 35% from engagement
  const confidence = Math.min(95, 60 + Math.min(engagedCount * 4, 35));

  const salaryLabel = formatSalaryRange(
    inferredProfile.salaryMin,
    inferredProfile.salaryMax,
    inferredProfile.salaryCurrency,
  );

  const handleAdjustSubmit = () => {
    // Store adjusted preferences in sessionStorage for the inference engine
    try {
      sessionStorage.setItem('pf_adjusted_profile', JSON.stringify({
        role: adjustedRole,
        location: adjustedLocation,
        salaryMin: adjustedSalaryMin,
        salaryMax: adjustedSalaryMax,
      }));
    } catch { /* ignore */ }
    setAdjusting(false);
    setDismissed(true);
    onConfirm(false); // Signal that user adjusted (not accepted as-is)
  };

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
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
              We&apos;re learning your taste
            </p>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              Based on what you&apos;ve browsed, you seem to be interested in:
            </h4>
          </div>
        </div>

        {/* Confidence indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
              Confidence
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {confidence}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
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

        {/* Adjust preferences inline form */}
        {adjusting && (
          <div className="rounded-xl bg-white/80 dark:bg-gray-800/60 border border-indigo-200/50 dark:border-indigo-700/20 p-4 mb-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Adjust your preferences
              </p>
            </div>

            {/* Role selector */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Role</label>
              <select
                value={adjustedRole}
                onChange={(e) => setAdjustedRole(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Location selector */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Location</label>
              <select
                value={adjustedLocation}
                onChange={(e) => setAdjustedLocation(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Salary range */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Salary range (ZAR/month)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustedSalaryMin}
                  onChange={(e) => setAdjustedSalaryMin(Number(e.target.value))}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Min"
                  min={0}
                  step={1000}
                />
                <span className="text-xs text-gray-400">–</span>
                <input
                  type="number"
                  value={adjustedSalaryMax}
                  onChange={(e) => setAdjustedSalaryMax(Number(e.target.value))}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Max"
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <button
              onClick={handleAdjustSubmit}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-700 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors active:scale-[0.98]"
            >
              Apply changes
            </button>
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              onConfirm(true);
              setDismissed(true);
            }}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-indigo-500/25 transition-all active:scale-[0.98] min-h-[44px]"
          >
            Yes, keep going ✓
          </button>
          <button
            onClick={() => {
              setAdjusting((v) => !v);
              if (adjusting) onConfirm(false);
            }}
            className="flex items-center justify-center gap-1 py-2.5 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors min-h-[44px]"
          >
            {adjusting ? 'Cancel' : 'Not quite right?'}
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
