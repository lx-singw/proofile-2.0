'use client';

/**
 * ProofileScoreBadge
 *
 * Displayed above the HomeFeedTabs for logged-in users. Shows:
 *   - Current Proofile Score (global_score)
 *   - Delta vs last session (stored in localStorage)
 *   - Contextual label (Rising · Strong · Top Applicant)
 *
 * Delta mechanic:
 *   On mount, reads `pf_last_score` from localStorage.
 *   After rendering, writes current score to `pf_last_score`.
 *   Delta = currentScore − lastScore (shown for 30 days, then cleared).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SCORE_KEY = 'pf_last_score';
const SCORE_TS_KEY = 'pf_last_score_ts';
const DELTA_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface ScoreDelta {
  value: number; // positive = improved, negative = declined, 0 = same
  isNew: boolean; // first session — no previous score to compare
}

function readLastScore(): { score: number; ts: number } | null {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const ts = parseInt(localStorage.getItem(SCORE_TS_KEY) ?? '0', 10);
    if (!raw) return null;
    if (Date.now() - ts > DELTA_TTL_MS) {
      localStorage.removeItem(SCORE_KEY);
      localStorage.removeItem(SCORE_TS_KEY);
      return null;
    }
    return { score: parseInt(raw, 10), ts };
  } catch {
    return null;
  }
}

function writeLastScore(score: number): void {
  try {
    localStorage.setItem(SCORE_KEY, String(score));
    localStorage.setItem(SCORE_TS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Top Applicant', color: 'text-amber-500' };
  if (score >= 70) return { label: 'Strong', color: 'text-emerald-500' };
  if (score >= 50) return { label: 'Rising', color: 'text-blue-500' };
  if (score >= 30) return { label: 'Building', color: 'text-gray-400' };
  return { label: 'Getting started', color: 'text-gray-400' };
}

interface ProofileScoreBadgeProps {
  score: number;
  totalReviews: number;
}

export function ProofileScoreBadge({ score, totalReviews }: ProofileScoreBadgeProps) {
  const [delta, setDelta] = useState<ScoreDelta | null>(null);

  useEffect(() => {
    const last = readLastScore();
    if (last === null) {
      setDelta({ value: 0, isNew: true });
    } else {
      setDelta({ value: score - last.score, isNew: false });
    }
    // Write current score for next session
    writeLastScore(score);
  }, [score]);

  const { label, color } = getScoreLabel(score);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Score circle */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke="url(#score-gradient)"
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 100.5} 100.5`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
            {score}
          </span>
        </div>

        {/* Label + reviews */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              Proofile Score
            </span>
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {totalReviews} verified review{totalReviews !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Delta + CTA */}
      <div className="flex items-center gap-3">
        {/* Session delta */}
        {delta && !delta.isNew && delta.value !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-bold ${delta.value > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
            {delta.value > 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {delta.value > 0 ? '+' : ''}{delta.value}
          </div>
        )}
        {delta && !delta.isNew && delta.value === 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Minus className="w-3.5 h-3.5" />
          </div>
        )}

        {/* CTA to improve */}
        {score < 70 && (
          <Link
            href="/profile#reviews"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            Improve →
          </Link>
        )}
        {score >= 70 && (
          <Link
            href="/profile"
            className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:underline whitespace-nowrap"
          >
            View profile →
          </Link>
        )}
      </div>
    </div>
  );
}
