'use client';

/**
 * UpgradePrompt
 *
 * Three non-blocking upgrade prompts triggered by user actions:
 *
 * - `save_prompt`      — Anonymous user tapped Save. Slide-up sheet.
 * - `interest_prompt`  — Profile (unverified) user tapped Express Interest.
 * - `score_upgrade`    — Verified user with Score < 70 (feed card variant).
 *
 * All variants have an explicit dismiss path so the user never feels trapped.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Bookmark, ArrowRight, Shield, Star, Users } from 'lucide-react';

export type UpgradePromptVariant = 'save_prompt' | 'interest_prompt' | 'score_upgrade' | 'network_prompt';

interface UpgradePromptProps {
  variant: UpgradePromptVariant;
  onDismiss: () => void;
  /** Optional: current Proofile Score (used in score_upgrade) */
  currentScore?: number;
}

// ── Backdrop + slide-up sheet ─────────────────────────────────────────────────

function Sheet({
  children,
  onDismiss,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onDismiss]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {children}
      </div>
    </div>
  );
}

// ── Save prompt (anonymous) ───────────────────────────────────────────────────

function SavePrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="p-5">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
          <Bookmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Save this opportunity?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Create a free account in 30 seconds to save jobs and get real match strength on every card.
        </p>

        {/* Primary CTA */}
        <Link
          href="/signup"
          className="block w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold text-center rounded-xl hover:shadow-md hover:shadow-emerald-500/25 transition-all active:scale-[0.98] mb-3"
        >
          Create free account — 30 seconds
        </Link>

        {/* Already have one */}
        <Link
          href="/login"
          className="block w-full py-2.5 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 text-center border border-gray-200/60 dark:border-gray-600/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2"
        >
          I already have an account
        </Link>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="block w-full py-2.5 px-4 text-xs text-gray-400 dark:text-gray-500 text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Continue browsing without saving
        </button>
      </div>
    </Sheet>
  );
}

// ── Interest prompt (unverified profile) ──────────────────────────────────────

function InterestPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
      <div className="p-5">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-3">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Recruiters prefer verified applicants
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          This recruiter requires at least 1 verified review before reviewing your application.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
          Verified applicants are contacted 4× more often. It takes one email to a former manager.
        </p>

        {/* Primary CTA */}
        <Link
          href="/profile#reviews"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-[0.98] mb-3"
        >
          Request a review now
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Dismiss: save for later */}
        <button
          onClick={onDismiss}
          className="block w-full py-2.5 px-4 text-xs text-gray-400 dark:text-gray-500 text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Save for later instead
        </button>
      </div>
    </Sheet>
  );
}

// ── Score upgrade (rendered as a standalone non-modal prompt) ─────────────────

function ScoreUpgradePrompt({
  currentScore,
  onDismiss,
}: {
  currentScore: number;
  onDismiss: () => void;
}) {
  const reviewsNeeded = currentScore >= 60 ? 1 : currentScore >= 40 ? 2 : 3;

  return (
    <Sheet onDismiss={onDismiss}>
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
      <div className="p-5">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-3">
          <Star className="w-5 h-5 text-amber-500" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          Top Applicant: {reviewsNeeded} review{reviewsNeeded !== 1 ? 's' : ''} away
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Your current Proofile Score is{' '}
          <span className="font-bold text-gray-900 dark:text-white">{currentScore}</span>.
          Reach <span className="font-bold text-amber-500">70+</span> to become a Top Applicant.
        </p>

        {/* Progress bar */}
        <div className="rounded-full bg-gray-100 dark:bg-gray-700 h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, currentScore)}%` }}
          />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
          Top Applicants get contacted directly by recruiters 4× more often and are shown first in search results.
        </p>

        <Link
          href="/profile#reviews"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-md transition-all active:scale-[0.98] mb-3"
        >
          Request another review
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          onClick={onDismiss}
          className="block w-full py-2.5 text-xs text-gray-400 dark:text-gray-500 text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Remind me later
        </button>
      </div>
    </Sheet>
  );
}

// ── Network prompt (anonymous user taps social proof / avatar) ────────────────

function NetworkPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Sheet onDismiss={onDismiss}>
      <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
      <div className="p-5">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center mb-3">
          <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          See who's interested in this role
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Your future colleagues might already be here. Create a free account to see who's interested and connect with them.
        </p>

        {/* Primary CTA */}
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold rounded-xl hover:shadow-md hover:shadow-teal-500/25 transition-all active:scale-[0.98] mb-3"
        >
          Create free account
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/login"
          className="block w-full py-2.5 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 text-center border border-gray-200/60 dark:border-gray-600/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2"
        >
          Sign in
        </Link>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="block w-full py-2.5 px-4 text-xs text-gray-400 dark:text-gray-500 text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Continue browsing
        </button>
      </div>
    </Sheet>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export function UpgradePrompt({ variant, onDismiss, currentScore }: UpgradePromptProps) {
  if (variant === 'save_prompt') return <SavePrompt onDismiss={onDismiss} />;
  if (variant === 'interest_prompt') return <InterestPrompt onDismiss={onDismiss} />;
  if (variant === 'score_upgrade')
    return <ScoreUpgradePrompt currentScore={currentScore ?? 50} onDismiss={onDismiss} />;
  if (variant === 'network_prompt') return <NetworkPrompt onDismiss={onDismiss} />;
  return null;
}
