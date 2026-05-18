/**
 * useFeedSignals — Per-card interaction tracker
 *
 * Tracks viewport entry, dwell time (3s / 10s), explicit actions (interest,
 * dismiss, save, share) and accumulates signals for the session inference
 * engine.
 *
 * Phase 0/B:
 *   - Anonymous: signals written to localStorage key `pf_session_signals`
 *   - Logged-in:  signals would POST to /api/v1/feed/signal; for now
 *                 we log to console so the shape is visible during dev
 */

import { useRef, useCallback } from 'react';
import { SignalEvent, SignalType, FeedCardType } from '@/types/feedCard';
import { apiRequest } from '@/lib/api';

// ── Session ID ────────────────────────────────────────────────────────────────

const SESSION_ID_KEY = 'pf_session_id';
const SIGNALS_KEY = 'pf_session_signals';
const MAX_STORED_SIGNALS = 500; // cap to avoid unbounded localStorage growth

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

// ── Signal storage helpers ────────────────────────────────────────────────────

function readStoredSignals(): SignalEvent[] {
  try {
    const raw = localStorage.getItem(SIGNALS_KEY);
    return raw ? (JSON.parse(raw) as SignalEvent[]) : [];
  } catch {
    return [];
  }
}

function appendStoredSignal(signal: SignalEvent): void {
  try {
    const existing = readStoredSignals();
    const updated = [...existing, signal].slice(-MAX_STORED_SIGNALS);
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearStoredSignals(): void {
  try {
    localStorage.removeItem(SIGNALS_KEY);
  } catch {
    // ignore
  }
}

export { readStoredSignals };

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseFeedSignalsOptions {
  userId: string | null;
}

interface CardSignalAttachment {
  /** Call when a card enters the viewport. Returns a cleanup function. */
  onCardVisible: (
    cardId: string,
    feedPosition: number,
    cardType: FeedCardType,
    element: HTMLElement,
  ) => () => void;
  /** Fire an explicit action signal (interest, dismiss, save, etc.) */
  fireSignal: (
    cardId: string,
    feedPosition: number,
    cardType: FeedCardType,
    signalType: SignalType,
  ) => void;
}

export function useFeedSignals({ userId }: UseFeedSignalsOptions): CardSignalAttachment {
  const sessionId = useRef<string>(getOrCreateSessionId());
  const mountTime = useRef<number>(Date.now());

  const emit = useCallback(
    (signal: SignalEvent) => {
      // Always persist locally for session inference / offline support
      appendStoredSignal(signal);

      // Also POST to backend (fire-and-forget — never block the UI)
      const opportunityId = signal.cardId ? parseInt(signal.cardId, 10) : undefined;
      const isOpportunityCard = signal.cardType === 'opportunity';

      const body = {
        session_id: signal.sessionId,
        opportunity_id: isOpportunityCard && !Number.isNaN(opportunityId) ? opportunityId : undefined,
        card_type: signal.cardType ?? 'opportunity',
        signal_type: signal.signalType,
        feed_position: signal.feedPosition,
        session_duration_ms: signal.sessionDurationAtSignal,
      };

      apiRequest<void>({
        method: 'post',
        url: '/api/v1/feed/signals',
        data: body,
      }).catch(() => {
        // Signal delivery is best-effort — silently ignore network errors
      });
    },
    [],
  );

  const buildSignal = useCallback(
    (
      cardId: string,
      feedPosition: number,
      cardType: FeedCardType,
      signalType: SignalType,
    ): SignalEvent => ({
      cardId,
      userId,
      sessionId: sessionId.current,
      signalType,
      timestamp: Date.now(),
      feedPosition,
      cardType,
      sessionDurationAtSignal: Date.now() - mountTime.current,
    }),
    [userId],
  );

  const fireSignal = useCallback(
    (
      cardId: string,
      feedPosition: number,
      cardType: FeedCardType,
      signalType: SignalType,
    ) => {
      emit(buildSignal(cardId, feedPosition, cardType, signalType));
    },
    [emit, buildSignal],
  );

  /**
   * Attach viewport tracking to a card element.
   * Returns a cleanup function — call it when the card unmounts.
   */
  const onCardVisible = useCallback(
    (
      cardId: string,
      feedPosition: number,
      cardType: FeedCardType,
      element: HTMLElement,
    ): (() => void) => {
      let dwell3Timer: ReturnType<typeof setTimeout> | null = null;
      let dwell10Timer: ReturnType<typeof setTimeout> | null = null;
      let hasEmittedView = false;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (entry.isIntersecting) {
            // Card entered viewport
            if (!hasEmittedView) {
              hasEmittedView = true;
              emit(buildSignal(cardId, feedPosition, cardType, 'view'));
            }

            dwell3Timer = setTimeout(() => {
              emit(buildSignal(cardId, feedPosition, cardType, 'dwell_3s'));
            }, 3000);

            dwell10Timer = setTimeout(() => {
              emit(buildSignal(cardId, feedPosition, cardType, 'dwell_10s'));
            }, 10000);
          } else {
            // Card left viewport
            if (dwell3Timer) { clearTimeout(dwell3Timer); dwell3Timer = null; }
            if (dwell10Timer) { clearTimeout(dwell10Timer); dwell10Timer = null; }

            // If it left quickly without a dwell signal, it was a scroll_past
            if (!hasEmittedView) {
              emit(buildSignal(cardId, feedPosition, cardType, 'scroll_past'));
            }
          }
        },
        { threshold: 0.5 }, // 50% of card must be visible to count as "viewed"
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
        if (dwell3Timer) clearTimeout(dwell3Timer);
        if (dwell10Timer) clearTimeout(dwell10Timer);
      };
    },
    [emit, buildSignal],
  );

  return { onCardVisible, fireSignal };
}
