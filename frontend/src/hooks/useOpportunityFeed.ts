import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedCard, FeedPageParams, UserFeedState, InferredProfile } from '@/types/feedCard';
import { getOpportunityFeedPage } from '@/services/opportunityFeedService';

interface UseOpportunityFeedOptions {
  userFeedState: UserFeedState;
  inferredProfile?: InferredProfile;
  sidebarFilters?: FeedPageParams['sidebarFilters'];
  /** Seed signals from an anonymous session that was just merged on login */
  sessionSeed?: InferredProfile;
}

interface UseOpportunityFeedResult {
  cards: FeedCard[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  /** Ref to attach to the sentinel element at the bottom of the feed */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function useOpportunityFeed({
  userFeedState,
  inferredProfile,
  sidebarFilters,
  sessionSeed,
}: UseOpportunityFeedOptions): UseOpportunityFeedResult {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const prefetchRef = useRef<FeedCard[] | null>(null);
  const prefetchCursorRef = useRef<string | null>(null);
  const isLoadingMoreRef = useRef(false);
  const loadVersion = useRef(0);

  const effectiveProfile = sessionSeed ?? inferredProfile;

  const buildParams = useCallback(
    (cursorValue?: string): FeedPageParams => ({
      cursor: cursorValue,
      userFeedState,
      inferredProfile: effectiveProfile,
      sidebarFilters,
    }),
    [userFeedState, effectiveProfile, sidebarFilters],
  );

  // ── Prefetch next page ────────────────────────────────────────────────────
  const prefetchNext = useCallback(
    async (nextCursor: string) => {
      try {
        const page = await getOpportunityFeedPage(buildParams(nextCursor));
        prefetchRef.current = page.cards;
        prefetchCursorRef.current = page.nextCursor;
      } catch {
        // silently fail — loadMore will fetch fresh if cache is empty
      }
    },
    [buildParams],
  );

  // ── Initial load / refresh ────────────────────────────────────────────────
  const load = useCallback(
    async (version: number) => {
      setIsLoading(true);
      setError(null);
      prefetchRef.current = null;
      prefetchCursorRef.current = null;

      try {
        const page = await getOpportunityFeedPage(buildParams(undefined));
        if (version !== loadVersion.current) return; // stale, discard
        setCards(page.cards);
        setCursor(page.nextCursor ?? undefined);
        setHasMore(page.hasMore);

        // Pre-fetch second page immediately
        if (page.nextCursor) {
          prefetchNext(page.nextCursor);
        }
      } catch (err) {
        if (version !== loadVersion.current) return;
        setError('Could not load opportunities. Please try again.');
      } finally {
        if (version === loadVersion.current) setIsLoading(false);
      }
    },
    [buildParams, prefetchNext],
  );

  const refresh = useCallback(() => {
    loadVersion.current += 1;
    setCursor(undefined);
    setCards([]);
    setHasMore(true);
    load(loadVersion.current);
  }, [load]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      let newCards: FeedCard[];
      let nextCursor: string | null;

      if (prefetchRef.current) {
        // Use pre-fetched data
        newCards = prefetchRef.current;
        nextCursor = prefetchCursorRef.current;
        prefetchRef.current = null;
        prefetchCursorRef.current = null;
      } else {
        const page = await getOpportunityFeedPage(buildParams(cursor));
        newCards = page.cards;
        nextCursor = page.nextCursor;
        setHasMore(page.hasMore);
      }

      setCards((prev) => [...prev, ...newCards]);
      setCursor(nextCursor ?? undefined);
      setHasMore(!!nextCursor);

      // Pre-fetch the one after
      if (nextCursor) prefetchNext(nextCursor);
    } catch {
      // Non-fatal — user can scroll more to retry
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, cursor, buildParams, prefetchNext]);

  // ── Initial load on mount + when key params change ────────────────────────
  useEffect(() => {
    loadVersion.current += 1;
    const v = loadVersion.current;
    setCursor(undefined);
    setCards([]);
    setHasMore(true);
    load(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFeedState, JSON.stringify(sidebarFilters)]);

  // ── IntersectionObserver on sentinel ─────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMoreRef.current) {
          loadMore();
        }
      },
      { rootMargin: '400px' }, // trigger 400px before sentinel enters viewport
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return {
    cards,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}
