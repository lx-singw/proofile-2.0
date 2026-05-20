'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PULL_THRESHOLD = 60; // px before refresh triggers
const RESISTANCE = 0.4;    // dampening so the pull feels elastic

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;  // 0–PULL_THRESHOLD (clamped)
  pullProgress: number;  // 0–1 ratio
  isRefreshing: boolean;
}

/**
 * Attaches pull-to-refresh touch listeners to an existing scrollable container.
 * Only fires when the container is scrolled to the very top (scrollTop <= 2).
 * Touch-only — no-op on desktop pointer events.
 */
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  containerRef: React.RefObject<HTMLElement | null>,
): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStartY = useRef(0);
  const active = useRef(false);
  const distanceRef = useRef(0); // track without re-rendering handleTouchEnd

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 2) return;
    touchStartY.current = e.touches[0].clientY;
    active.current = true;
  }, [containerRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current || isRefreshing) return;
    const raw = e.touches[0].clientY - touchStartY.current;
    if (raw <= 0) {
      active.current = false;
      setIsPulling(false);
      setPullDistance(0);
      distanceRef.current = 0;
      return;
    }
    const dampened = Math.min(raw * RESISTANCE, PULL_THRESHOLD * 1.3);
    distanceRef.current = dampened;
    setIsPulling(true);
    setPullDistance(dampened);
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;

    if (distanceRef.current >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      setPullDistance(0);
      distanceRef.current = 0;
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 800);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
      distanceRef.current = 0;
    }
  }, [isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling,
    pullDistance: Math.min(pullDistance, PULL_THRESHOLD),
    pullProgress: Math.min(pullDistance / PULL_THRESHOLD, 1),
    isRefreshing,
  };
}
