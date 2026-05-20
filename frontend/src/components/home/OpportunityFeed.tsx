'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react';
import {
  FeedCard,
  OpportunityFeedCard,
  InsightFeedCard,
  TrustNudgeCard as TrustNudgeCardType,
  LearningTriggerCard as LearningTriggerCardType,
  ScoreUpgradeCard,
  UserFeedState,
} from '@/types/feedCard';
import { useOpportunityFeed } from '@/hooks/useOpportunityFeed';
import { useFeedSignals } from '@/hooks/useFeedSignals';
import { useSessionFeed } from '@/hooks/useSessionFeed';
import { storeCardMeta } from '@/hooks/useSessionFeed';
import { useReviewerConnections } from '@/hooks/useReviewerConnections';
import { expressInterest, recordApplyClick, recordShare, toggleSave, getFeedStats } from '@/services/opportunityFeedService';
import { useInsightCards } from '@/hooks/useInsightCards';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { MatchCard } from './feed/MatchCard';
import { InsightCard } from './feed/InsightCard';
import { LearningTriggerCard } from './feed/LearningTriggerCard';
import { TrustNudgeCard } from './feed/TrustNudgeCard';
import { FeedCardSkeleton, FeedCardSkeletonList } from './feed/FeedCardSkeleton';
import type { InferredProfile } from '@/types/feedCard';

interface OpportunityFeedProps {
  userFeedState: UserFeedState;
  userId?: string | null;
  inferredProfile?: InferredProfile;
  sessionSeed?: InferredProfile;
  currentScore?: number; // for ScoreUpgradeCard injection (verified users < 70)
  sidebarFilters?: {
    location?: string;
    industry?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills?: string[];
    opportunityTypes?: string[];
  };
  /** Callback when anonymous user taps Save — parent handles upgrade prompt */
  onAnonymousSave?: (card: OpportunityFeedCard) => void;
  /** Callback when unverified user taps Express Interest — parent handles upgrade prompt */
  onUnverifiedInterest?: (card: OpportunityFeedCard) => void;
  /** Callback when anonymous user taps on social proof / network content */
  onNetworkPrompt?: () => void;
}

// ── Score upgrade card builder ────────────────────────────────────────────────

function makeScoreUpgradeCard(currentScore: number): ScoreUpgradeCard {
  const reviewsNeeded = currentScore >= 60 ? 1 : currentScore >= 40 ? 2 : 3;
  return {
    type: 'score_upgrade',
    id: `score-upgrade-${Date.now()}`,
    currentScore,
    reviewsNeeded,
    targetScore: 70,
  };
}

// ── Static trust nudge card ───────────────────────────────────────────────────

function makeTrustNudgeCard(): TrustNudgeCardType {
  return {
    type: 'trust_nudge',
    id: `trust-nudge-${Date.now()}`,
    totalApplicants: 340,
    verifiedApplicants: 12,
  };
}

// ── Card mix: inject non-job cards at phase-correct positions ─────────────────

function buildMixedCards(
  baseCards: FeedCard[],
  userFeedState: UserFeedState,
  isLearning: boolean,
  inferredProfile: InferredProfile | null,
  learningShownRef: React.MutableRefObject<boolean>,
  insightPool: InsightFeedCard[],
  shownInsightIds: Set<string>,
  currentScore?: number,
): { cards: FeedCard[]; shownIds: Set<string> } {
  const result: FeedCard[] = [];
  let trustNudgeCount = 0;
  const MAX_TRUST_NUDGE_PER_20 = 1;
  let insightIndex = 0;
  const newShownIds = new Set(shownInsightIds);

  // Filter pool: graph_discovery only for verified users
  const availableInsights = insightPool.filter((c) => {
    if (c.type === 'graph_discovery') return userFeedState === 'verified';
    return true;
  });

  for (let i = 0; i < baseCards.length; i++) {
    result.push(baseCards[i]);

    const position = result.length; // 1-based after push

    // ── Insight cards from backend pool — inject every 5th card ──
    if (
      position % 5 === 0 &&
      insightIndex < availableInsights.length
    ) {
      const insight = availableInsights[insightIndex++];
      if (!newShownIds.has(insight.id)) {
        result.push(insight);
        newShownIds.add(insight.id);
      }
    }

    // ── LearningTriggerCard — anonymous only, once per session ──
    if (
      userFeedState === 'anonymous' &&
      isLearning &&
      !learningShownRef.current &&
      inferredProfile &&
      position >= 8 // let user see at least 8 cards first
    ) {
      result.push({
        type: 'learning_trigger',
        id: `learning-trigger-${Date.now()}`,
        inferredRole: inferredProfile.role,
        inferredLocation: inferredProfile.location,
        inferredSalaryMin: inferredProfile.salaryMin,
        inferredSalaryMax: inferredProfile.salaryMax,
        salaryCurrency: inferredProfile.salaryCurrency,
      } satisfies LearningTriggerCardType);
      learningShownRef.current = true;
    }

    // ── TrustNudgeCard — profile users, every 8th opp card (max 1 per 20) ──
    if (
      userFeedState === 'profile' &&
      baseCards[i].type === 'opportunity' &&
      (i + 1) % 8 === 0 &&
      trustNudgeCount < MAX_TRUST_NUDGE_PER_20 * Math.ceil(result.length / 20)
    ) {
      result.push(makeTrustNudgeCard());
      trustNudgeCount++;
    }

    // ── ScoreUpgradeCard — verified users with score < 70, every ~15 cards ──
    if (
      userFeedState === 'verified' &&
      currentScore !== undefined &&
      currentScore < 70 &&
      position % 15 === 0
    ) {
      result.push(makeScoreUpgradeCard(currentScore));
    }
  }

  return { cards: result, shownIds: newShownIds };
}

// ── Virtual window: only render cards within viewport index range ─────────────
// Phase B: index-based show/hide. We keep all cards mounted but hide distant ones
// to preserve scroll position while freeing paint work.

const VIRTUAL_BUFFER = 5; // cards above/below visible area to keep mounted

function useVirtualWindow(totalCount: number) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(10, totalCount) });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRange = () => {
      const children = Array.from(container.children) as HTMLElement[];
      let firstVisible = 0;
      let lastVisible = children.length - 1;

      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          firstVisible = i;
          break;
        }
      }
      for (let i = children.length - 1; i >= 0; i--) {
        const rect = children[i].getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          lastVisible = i;
          break;
        }
      }

      setVisibleRange({
        start: Math.max(0, firstVisible - VIRTUAL_BUFFER),
        end: Math.min(children.length - 1, lastVisible + VIRTUAL_BUFFER),
      });
    };

    const observer = new IntersectionObserver(updateRange, { threshold: 0 });
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [totalCount]);

  return { containerRef, visibleRange };
}

// ── ScoreUpgrade inline card renderer ────────────────────────────────────────

function ScoreUpgradeInlineCard({ card }: { card: ScoreUpgradeCard }) {
  return (
    <div className="rounded-2xl border border-amber-200/60 dark:border-amber-700/30 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-800/80 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
      <div className="p-4 flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">⭐</div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
            Top Applicant status: {card.reviewsNeeded} review{card.reviewsNeeded !== 1 ? 's' : ''} away
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2.5">
            Users with a Proofile Score of {card.targetScore}+ are labelled &quot;Top Applicant&quot; and contacted directly by recruiters 4× more often. You have a score of {card.currentScore}. You need {card.reviewsNeeded} more verified review{card.reviewsNeeded !== 1 ? 's' : ''}.
          </p>
          <Link
            href="/profile#reviews"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Request another review →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OpportunityFeed({
  userFeedState,
  userId,
  inferredProfile,
  sessionSeed,
  currentScore,
  sidebarFilters,
  onAnonymousSave,
  onUnverifiedInterest,
  onNetworkPrompt,
}: OpportunityFeedProps) {
  const { cards, isLoading, isLoadingMore, hasMore, error, refresh, sentinelRef } =
    useOpportunityFeed({
      userFeedState,
      inferredProfile,
      sessionSeed,
      sidebarFilters,
    });

  // ── Load live insight cards + stats from backend ──────────────────────────
  const { pool: insightPool } = useInsightCards(userFeedState);

  const [feedStats, setFeedStats] = useState({ totalApplicantsThisWeek: 340, verifiedApplicantsThisWeek: 12 });
  useEffect(() => {
    getFeedStats().then(setFeedStats).catch(() => undefined);
  }, []);

  // ── Signal tracking ───────────────────────────────────────────────────────
  const { onCardVisible, fireSignal } = useFeedSignals({
    userId: userId ?? null,
  });

  // ── Session inference ─────────────────────────────────────────────────────
  const {
    inferredProfile: sessionInferred,
    isLearning,
    confirmInferred,
    engagedCount,
    sessionDurationMs,
  } = useSessionFeed();

  // Guard: only inject LearningTriggerCard once per session
  const learningShownRef = useRef(false);

  // ── Reviewer connections (verified users only) ────────────────────────────
  const companyNames = useMemo(
    () =>
      cards
        .filter((c) => c.type === 'opportunity')
        .map((c) => (c as OpportunityFeedCard).companyName)
        .filter(Boolean),
    [cards],
  );
  const { connections: reviewerConnections } = useReviewerConnections(
    companyNames,
    userFeedState === 'verified',
  );

  // ── Store card metadata for session inference ─────────────────────────────
  useEffect(() => {
    for (const card of cards) {
      if (card.type !== 'opportunity') continue;
      const opp = card as OpportunityFeedCard;
      storeCardMeta({
        cardId: opp.id,
        roleTitle: opp.roleTitle,
        location: opp.location,
        salaryMin: opp.salaryMin,
        salaryMax: opp.salaryMax,
        skills: opp.requiredSkills,
      });
    }
  }, [cards]);

  // ── Deduplication: track which insight cards have been shown (useRef, not useState) ──
  const shownInsightIdsRef = useRef(new Set<string>());

  // ── Card mix: inject non-job cards ────────────────────────────────────────
  const mixedCards = useMemo(() => {
    const { cards: mixed, shownIds } = buildMixedCards(
      cards,
      userFeedState,
      isLearning,
      sessionInferred,
      learningShownRef,
      insightPool,
      shownInsightIdsRef.current,
      currentScore,
    );
    shownInsightIdsRef.current = shownIds;
    return mixed;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, userFeedState, isLearning, sessionInferred, learningShownRef, insightPool, currentScore]);


  // ── Virtual windowing ─────────────────────────────────────────────────────
  const { containerRef, visibleRange } = useVirtualWindow(mixedCards.length);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const { isPulling, pullProgress, isRefreshing } = usePullToRefresh(refresh, containerRef);

  // ── Card ref registration for signals ────────────────────────────────────
  const signalCleanupRef = useRef<Map<string, () => void>>(new Map());

  const cardRefCallback = useCallback(
    (el: HTMLDivElement | null, card: FeedCard, index: number) => {
      if (el && card.type === 'opportunity') {
        // Only register once per card element
        if (!signalCleanupRef.current.has(card.id)) {
          const cleanup = onCardVisible(card.id, index, card.type, el);
          signalCleanupRef.current.set(card.id, cleanup);
        }
      } else if (!el) {
        // Element unmounted — run cleanup
        const cleanup = signalCleanupRef.current.get(card.id);
        if (cleanup) {
          cleanup();
          signalCleanupRef.current.delete(card.id);
        }
      }
    },
    [onCardVisible],
  );

  // ── Early returns ─────────────────────────────────────────────────────────

  if (isLoading) {
    return <FeedCardSkeletonList count={3} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/50 dark:border-red-800/20 bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  if (mixedCards.length === 0) {
    const hasActiveFilters =
      sidebarFilters &&
      Object.values(sidebarFilters).some((v) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      );
    return (
      <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/60 p-10 text-center space-y-3">
        <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
        <p className="text-gray-600 dark:text-gray-300 font-semibold">
          {hasActiveFilters ? 'No opportunities match your filters' : 'No opportunities right now'}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {hasActiveFilters
            ? 'Try removing some filters to see more results.'
            : 'Check back soon — new listings are added daily.'}
        </p>
        <Link
          href="/opportunities"
          className="mt-1 inline-block text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Browse all opportunities →
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto scroll-smooth [scroll-snap-type:y_proximity] md:[scroll-snap-type:none] scrollbar-thin scrollbar-thumb-emerald-500/60 scrollbar-track-gray-100 dark:scrollbar-thumb-emerald-600/60 dark:scrollbar-track-gray-800 pr-2"
      ref={containerRef}
    >
      {/* Pull-to-refresh indicator (mobile only) */}
      {(isPulling || isRefreshing) && (
        <div className="flex items-center justify-center py-3 text-sm text-emerald-600 dark:text-emerald-400 select-none">
          <RefreshCw className={`w-4 h-4 mr-2 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
            style={!isRefreshing ? { transform: `rotate(${Math.round(pullProgress * 270)}deg)` } : undefined}
          />
          {isRefreshing
            ? 'Recalibrating your feed...'
            : `Pull to refresh (${Math.round(pullProgress * 100)}%)`}
        </div>
      )}

      {mixedCards.map((card, i) => {
        // Virtual windowing: hide cards far outside the viewport
        const isInWindow = i >= visibleRange.start && i <= visibleRange.end;

        if (card.type === 'opportunity') {
          return (
            <div
              key={card.id}
              ref={(el) => cardRefCallback(el, card, i)}
              className="[scroll-snap-align:start] md:[scroll-snap-align:none]"
              style={!isInWindow ? { visibility: 'hidden', height: '400px' } : undefined}
            >
              <MatchCard
                card={card as OpportunityFeedCard}
                userFeedState={userFeedState}
                feedPosition={i}
                reviewerConnectionCount={
                  userFeedState === 'verified'
                    ? (reviewerConnections[(card as OpportunityFeedCard).companyName] ?? 0)
                    : undefined
                }
                onView={() => fireSignal(card.id, i, card.type, 'view')}
                onDwell={() => fireSignal(card.id, i, card.type, 'dwell_3s')}
                onExpand={() => fireSignal(card.id, i, card.type, 'expand')}
                onInterest={
                  userFeedState === 'profile' && onUnverifiedInterest
                    ? (c) => {
                        fireSignal(card.id, i, card.type, 'interest');
                        onUnverifiedInterest(c);
                      }
                    : undefined
                }
                onInterestToggle={
                  userFeedState === 'verified'
                    ? async (opportunityId, isInterested) => {
                        fireSignal(card.id, i, card.type, 'interest');
                        await expressInterest(opportunityId);
                        void isInterested; // state managed optimistically in MatchCard
                      }
                    : undefined
                }
                onSave={
                  userFeedState === 'anonymous' && onAnonymousSave
                    ? (c) => {
                        fireSignal(card.id, i, card.type, 'save');
                        onAnonymousSave(c);
                      }
                    : userFeedState !== 'anonymous'
                      ? async () => {
                          fireSignal(card.id, i, card.type, 'save');
                          await toggleSave(Number(card.id));
                        }
                    : undefined
                }
                onShare={async () => {
                  fireSignal(card.id, i, card.type, 'share');
                  if (userFeedState !== 'anonymous') {
                    await recordShare(Number(card.id));
                  }
                }}
                onApplyClick={async () => {
                  fireSignal(card.id, i, card.type, 'apply_click');
                  if (userFeedState !== 'anonymous') {
                    await recordApplyClick(Number(card.id));
                  }
                }}
                onDismiss={() => fireSignal(card.id, i, card.type, 'dismiss')}
                onNetworkPrompt={userFeedState === 'anonymous' ? onNetworkPrompt : undefined}
              />
            </div>
          );
        }

        if (
          card.type === 'trust_insight' ||
          card.type === 'graph_discovery' ||
          card.type === 'market_intelligence' ||
          card.type === 'community_proof'
        ) {
          return (
            <div key={card.id} style={!isInWindow ? { visibility: 'hidden', height: '120px' } : undefined}>
              <InsightCard card={card as InsightFeedCard} />
            </div>
          );
        }

        if (card.type === 'learning_trigger' && sessionInferred) {
          return (
            <div key={card.id}>
              <LearningTriggerCard
                inferredProfile={sessionInferred}
                onConfirm={confirmInferred}
                engagedCount={engagedCount}
              />
            </div>
          );
        }

        {/* Progressive disclosure: signup nudge for highly engaged anonymous users */}
        if (
          userFeedState === 'anonymous' &&
          sessionDurationMs > 10 * 60 * 1000 &&
          i > 15 && // show after they've seen some cards
          i % 20 === 0 // periodic reminder, not every card
        ) {
          return (
            <div
              key={`signup-nudge-${i}`}
              className="rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-gray-800/80 overflow-hidden shadow-sm"
            >
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
              <div className="p-5 text-center">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                  You&apos;re highly engaged
                </p>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Create a free account to unlock your real match strength
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  See verified match scores, save opportunities, and get contacted directly by recruiters.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold rounded-xl hover:shadow-md transition-all min-h-[44px]"
                  >
                    Create account — free
                  </Link>
                  <button
                    onClick={() => fireSignal('nudge-dismiss', i, 'opportunity', 'dismiss')}
                    className="inline-flex items-center justify-center py-2.5 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-600/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors min-h-[44px]"
                  >
                    Keep browsing
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (card.type === 'trust_nudge') {
          return (
            <div key={card.id} className="[scroll-snap-align:start] md:[scroll-snap-align:none]" style={!isInWindow ? { visibility: 'hidden', height: '120px' } : undefined}>
              <TrustNudgeCard
                totalApplicants={feedStats.totalApplicantsThisWeek}
                verifiedApplicants={feedStats.verifiedApplicantsThisWeek}
              />
            </div>
          );
        }

        if (card.type === 'score_upgrade') {
          return (
            <div key={card.id} style={!isInWindow ? { visibility: 'hidden', height: '120px' } : undefined}>
              <ScoreUpgradeInlineCard card={card as ScoreUpgradeCard} />
            </div>
          );
        }

        return null;
      })}

      {/* IntersectionObserver sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Loading more */}
      {isLoadingMore && <FeedCardSkeleton />}

      {/* End of feed */}
      {!hasMore && mixedCards.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve seen all current opportunities
          </p>
          <Link
            href="/opportunities"
            className="mt-2 inline-block text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Browse the full opportunity database →
          </Link>
        </div>
      )}
    </div>
  );
}
