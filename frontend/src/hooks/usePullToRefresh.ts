"use client";

import { useState, useEffect, useRef } from "react";

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 100 }: PullToRefreshOptions) {
    const [isPulling, setIsPulling] = useState(false);
    const [pullHeight, setPullHeight] = useState(0);
    const [loading, setLoading] = useState(false);
    const startY = useRef(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                startY.current = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (window.scrollY === 0 && startY.current > 0) {
                const currentY = e.touches[0].clientY;
                const delta = currentY - startY.current;

                if (delta > 0) {
                    // Prevent default pull behavior (like Chrome refresh) if handled
                    if (e.cancelable && delta < threshold + 50) e.preventDefault();

                    setIsPulling(true);
                    setPullHeight(Math.min(delta * 0.5, threshold + 20)); // Resistance
                }
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling) return;

            if (pullHeight > threshold) {
                setLoading(true);
                setPullHeight(60); // Snap to loading height
                await onRefresh();
                setLoading(false);
            }

            setPullHeight(0);
            setIsPulling(false);
            startY.current = 0;
        };

        element.addEventListener("touchstart", handleTouchStart, { passive: true });
        element.addEventListener("touchmove", handleTouchMove, { passive: false });
        element.addEventListener("touchend", handleTouchEnd);

        return () => {
            element.removeEventListener("touchstart", handleTouchStart);
            element.removeEventListener("touchmove", handleTouchMove);
            element.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isPulling, pullHeight, threshold, onRefresh]);

    return {
        contentRef,
        isPulling,
        pullHeight,
        loading
    };
}
