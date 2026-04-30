/**
 * useSessionFeed — Anonymous session inference engine
 *
 * Reads accumulated signals from `pf_session_signals` in localStorage and
 * derives an InferredProfile from what the user has actually engaged with
 * (dwell_3s+). After 5 engaged cards the profile becomes "learning"; after
 * 5–7 minutes of session time a LearningTriggerCard should be surfaced.
 *
 * This runs client-side only — no server round-trips needed for Phase 0.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalEvent, InferredProfile } from '@/types/feedCard';
import { readStoredSignals } from './useFeedSignals';

// How long (ms) before we consider the session "warm" enough to show the
// learning trigger card
const LEARNING_TRIGGER_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Minimum dwell_3s signals before we attempt inference
const MIN_ENGAGED_CARDS = 5;

// ── Inference helpers ─────────────────────────────────────────────────────────

/**
 * Reads the card metadata that was injected as data-* attrs on the article
 * element when the dwell signal fired. Since we don't have a server-side
 * inference model in Phase 0, we use a simple frequency analysis on the
 * card categories observed in engaged signals.
 *
 * The card metadata is stored alongside each signal event in a separate
 * key: pf_session_card_meta — a map of cardId → { role, location, salaryMin, salaryMax, skills }
 */

const CARD_META_KEY = 'pf_session_card_meta';

export interface CardMeta {
  cardId: string;
  roleTitle: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  skills: string[];
  industry?: string;
}

export function storeCardMeta(meta: CardMeta): void {
  try {
    const existing: Record<string, CardMeta> = JSON.parse(
      localStorage.getItem(CARD_META_KEY) ?? '{}',
    );
    existing[meta.cardId] = meta;
    // Cap at 200 entries
    const keys = Object.keys(existing);
    if (keys.length > 200) {
      keys.slice(0, keys.length - 200).forEach((k) => delete existing[k]);
    }
    localStorage.setItem(CARD_META_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function readCardMeta(): Record<string, CardMeta> {
  try {
    return JSON.parse(localStorage.getItem(CARD_META_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function clearCardMeta(): void {
  try {
    localStorage.removeItem(CARD_META_KEY);
  } catch {
    // ignore
  }
}

// ── Frequency-based inference ─────────────────────────────────────────────────

function mostFrequent<T>(items: T[]): T | undefined {
  const counts = new Map<string, { value: T; count: number }>();
  for (const item of items) {
    const key = String(item);
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { value: item, count: 1 });
  }
  let best: { value: T; count: number } | undefined;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.value;
}

function inferFromSignals(
  signals: SignalEvent[],
  cardMeta: Record<string, CardMeta>,
): Partial<InferredProfile> {
  // Only consider dwell_3s+ signals for inference (strong engagement)
  const engaged = signals.filter(
    (s) => s.signalType === 'dwell_3s' || s.signalType === 'dwell_10s',
  );

  if (engaged.length < MIN_ENGAGED_CARDS) return {};

  const engagedMeta = engaged
    .map((s) => cardMeta[s.cardId])
    .filter((m): m is CardMeta => !!m);

  if (engagedMeta.length < MIN_ENGAGED_CARDS) return {};

  const locations = engagedMeta.map((m) => m.location).filter(Boolean);
  const roles = engagedMeta.map((m) => m.roleTitle).filter(Boolean);
  const industries = engagedMeta.map((m) => m.industry).filter((v): v is string => !!v);
  const allSkills = engagedMeta.flatMap((m) => m.skills);

  // Salary: median of mins and maxes
  const salaryMins = engagedMeta.map((m) => m.salaryMin).filter((v): v is number => v !== undefined);
  const salaryMaxes = engagedMeta.map((m) => m.salaryMax).filter((v): v is number => v !== undefined);
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  // Top-5 most frequent skills
  const skillCounts = new Map<string, number>();
  for (const skill of allSkills) {
    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill]) => skill);

  return {
    role: mostFrequent(roles) ?? 'professional',
    location: mostFrequent(locations) ?? 'South Africa',
    industry: mostFrequent(industries),
    salaryMin: salaryMins.length ? median(salaryMins) : undefined,
    salaryMax: salaryMaxes.length ? median(salaryMaxes) : undefined,
    salaryCurrency: 'ZAR',
    skills: topSkills,
    confirmedByUser: false,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseSessionFeedResult {
  inferredProfile: InferredProfile | null;
  isLearning: boolean;
  confirmedByUser: boolean;
  /** Call when user taps "Yes, keep going" on the LearningTriggerCard */
  confirmInferred: (accepted: boolean) => void;
  /** Number of engaged cards so far */
  engagedCount: number;
  /** Session duration in ms */
  sessionDurationMs: number;
}

export function useSessionFeed(): UseSessionFeedResult {
  const mountTime = useRef(Date.now());
  const [sessionDurationMs, setSessionDurationMs] = useState(0);
  const [inferredProfile, setInferredProfile] = useState<InferredProfile | null>(null);
  const [confirmedByUser, setConfirmedByUser] = useState(false);
  const [engagedCount, setEngagedCount] = useState(0);

  // Tick session duration every 30s for isLearning check
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDurationMs(Date.now() - mountTime.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Re-derive inferred profile every 15s as new signals accumulate
  useEffect(() => {
    const derive = () => {
      const signals = readStoredSignals();
      const cardMeta = readCardMeta();
      const engaged = signals.filter(
        (s) => s.signalType === 'dwell_3s' || s.signalType === 'dwell_10s',
      );
      setEngagedCount(engaged.length);

      if (engaged.length >= MIN_ENGAGED_CARDS) {
        const partial = inferFromSignals(signals, cardMeta);
        if (partial.role) {
          setInferredProfile((prev) => ({
            role: partial.role ?? prev?.role ?? 'professional',
            location: partial.location ?? prev?.location ?? 'South Africa',
            industry: partial.industry ?? prev?.industry ?? '',
            salaryMin: partial.salaryMin ?? prev?.salaryMin ?? 0,
            salaryMax: partial.salaryMax ?? prev?.salaryMax ?? 0,
            salaryCurrency: 'ZAR',
            skills: partial.skills ?? prev?.skills ?? [],
            confirmedByUser: prev?.confirmedByUser ?? false,
          }));
        }
      }
    };

    derive(); // run immediately
    const interval = setInterval(derive, 15_000);
    return () => clearInterval(interval);
  }, []);

  const isLearning =
    !confirmedByUser &&
    sessionDurationMs >= LEARNING_TRIGGER_DURATION_MS &&
    inferredProfile !== null;

  const confirmInferred = useCallback((accepted: boolean) => {
    setConfirmedByUser(true);
    if (!accepted) {
      // User said "No, adjust" — clear inferred profile so next inference cycle
      // starts fresh. Clear stored meta but keep raw signals.
      try { localStorage.removeItem('pf_session_card_meta'); } catch { /* ignore */ }
      setInferredProfile(null);
    } else {
      setInferredProfile((prev) => prev ? { ...prev, confirmedByUser: true } : prev);
    }
  }, []);

  return {
    inferredProfile,
    isLearning,
    confirmedByUser,
    confirmInferred,
    engagedCount,
    sessionDurationMs,
  };
}
