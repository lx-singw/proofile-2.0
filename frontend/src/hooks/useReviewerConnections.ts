/**
 * useReviewerConnections
 *
 * Batch-fetches reviewer-company connection counts from the graph API.
 * Used in OpportunityFeed to hydrate the "X of your reviewers worked here"
 * field in MatchCard for verified users.
 *
 * - Only fires when `isVerified` is true and `companyNames` is non-empty.
 * - Results are cached for the lifetime of the component.
 * - Fails silently — returns 0 for any company that errors.
 */

import { useEffect, useRef, useState } from 'react';
import { batchReviewerConnections } from '@/services/graphService';

interface UseReviewerConnectionsResult {
  /** Map of companyName → number of reviewer connections */
  connections: Record<string, number>;
  isLoading: boolean;
}

export function useReviewerConnections(
  companyNames: string[],
  isVerified: boolean,
): UseReviewerConnectionsResult {
  const [connections, setConnections] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  // Track which names have already been fetched to avoid re-fetching on re-render
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isVerified || companyNames.length === 0) return;

    // Only fetch company names we haven't seen yet
    const toFetch = companyNames.filter((name) => name && !fetchedRef.current.has(name));
    if (toFetch.length === 0) return;

    let cancelled = false;
    setIsLoading(true);

    batchReviewerConnections(toFetch)
      .then((result) => {
        if (cancelled) return;
        toFetch.forEach((name) => fetchedRef.current.add(name));
        setConnections((prev) => ({ ...prev, ...result }));
      })
      .catch(() => {
        // fail silently — keep existing connections
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified, companyNames.join(',')]);

  return { connections, isLoading };
}
