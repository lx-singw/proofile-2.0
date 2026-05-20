/**
 * useInsightCards — Dynamic insight card pool manager
 *
 * Fetches personalised insight cards from the backend on mount,
 * refreshes every 5 minutes, and provides the pool to the feed
 * for mixing at correct ratios.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { InsightFeedCard } from '@/types/feedCard';
import { apiRequest } from '@/lib/api';

interface BackendInsightCard {
  type: string;
  id: string;
  headline: string;
  body: string;
  cta_label?: string | null;
  cta_href?: string | null;
  icon_key: string;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function mapBackendCard(card: BackendInsightCard): InsightFeedCard {
  return {
    type: card.type as InsightFeedCard['type'],
    id: card.id,
    headline: card.headline,
    body: card.body,
    ctaLabel: card.cta_label ?? undefined,
    ctaHref: card.cta_href ?? undefined,
    iconKey: card.icon_key as InsightFeedCard['iconKey'],
  };
}

export function useInsightCards(userFeedState?: string) {
  const [pool, setPool] = useState<InsightFeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasMounted = useRef(false);

  const fetchPool = useCallback(async () => {
    try {
      const result = await apiRequest<{ cards: BackendInsightCard[] }>({
        method: 'get',
        url: '/api/v1/feed/insight-cards',
      });
      setPool(result.cards.map(mapBackendCard));
      setError(null);
    } catch (err) {
      setError('Failed to load insight cards');
      // Keep existing pool on error (don't clear)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      // Initial mount: fetch + start interval
      hasMounted.current = true;
      fetchPool();
      const interval = setInterval(fetchPool, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    } else {
      // Subsequent userFeedState changes: refetch
      fetchPool();
    }
  }, [userFeedState, fetchPool]);

  return { pool, loading, error, refresh: fetchPool };
}
