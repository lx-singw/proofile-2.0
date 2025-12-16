"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface VerificationSummary {
    trust_score: number;
    level: "bronze" | "silver" | "gold" | "none";
    identity_verified: boolean;
    verified_jobs_count: number;
    verified_skills_count: number;
    pending_count: number;
    last_updated: string;
}

export interface VerificationItem {
    id: string;
    type: "identity" | "employment" | "education" | "skill";
    target_id?: string;
    target_name: string;
    status: "verified" | "pending" | "expired" | "rejected";
    method?: string;
    verified_at?: string;
    expires_at?: string;
}

interface UseVerificationStatusReturn {
    summary: VerificationSummary | null;
    items: VerificationItem[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const DEFAULT_SUMMARY: VerificationSummary = {
    trust_score: 0,
    level: "none",
    identity_verified: false,
    verified_jobs_count: 0,
    verified_skills_count: 0,
    pending_count: 0,
    last_updated: new Date().toISOString(),
};

export function useVerificationStatus(): UseVerificationStatusReturn {
    const [summary, setSummary] = useState<VerificationSummary | null>(null);
    const [items, setItems] = useState<VerificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch summary
            const summaryResponse = await api.get("/api/v1/verify/summary");
            setSummary(summaryResponse.data);

            // Fetch detailed items
            const itemsResponse = await api.get("/api/v1/verify/items");
            setItems(itemsResponse.data.items || []);
        } catch (err) {
            console.error("Failed to fetch verification status:", err);
            setError("Failed to load verification status");
            setSummary(DEFAULT_SUMMARY);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const refresh = useCallback(async () => {
        await fetchStatus();
    }, [fetchStatus]);

    return {
        summary,
        items,
        loading,
        error,
        refresh,
    };
}

/**
 * Calculate trust score level from numeric score
 */
export function getTrustLevel(score: number): "gold" | "silver" | "bronze" | "none" {
    if (score >= 71) return "gold";
    if (score >= 41) return "silver";
    if (score >= 10) return "bronze";
    return "none";
}

/**
 * Get display color for trust level
 */
export function getTrustLevelColor(level: string): string {
    switch (level) {
        case "gold":
            return "text-amber-500";
        case "silver":
            return "text-slate-400";
        case "bronze":
            return "text-orange-600";
        default:
            return "text-slate-500";
    }
}

export default useVerificationStatus;
