import { useQuery } from "@tanstack/react-query";
import analyticsService, { AnalyticsSummary, ProfileViewsData, CareerInsight } from "@/services/analyticsService";

// Query Keys
export const analyticsKeys = {
    all: ["analytics"] as const,
    summary: (period: string) => [...analyticsKeys.all, "summary", period] as const,
    views: (period: string) => [...analyticsKeys.all, "views", period] as const,
    insights: () => [...analyticsKeys.all, "insights"] as const,
};

// Analytics Summary Hook
export function useAnalyticsSummary(period: "7d" | "30d" | "90d" = "7d") {
    return useQuery({
        queryKey: analyticsKeys.summary(period),
        queryFn: () => analyticsService.getAnalyticsSummary(period),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

// Profile Views Hook
export function useProfileViews(period: "7d" | "30d" = "7d") {
    return useQuery({
        queryKey: analyticsKeys.views(period),
        queryFn: () => analyticsService.getProfileViews(period),
        staleTime: 1000 * 60 * 5,
    });
}

// Career Insights Hook
export function useCareerInsights() {
    return useQuery({
        queryKey: analyticsKeys.insights(),
        queryFn: analyticsService.getCareerInsights,
        staleTime: 1000 * 60 * 30, // 30 minutes - insights don't change often
    });
}

// Track event (fire and forget)
export function useTrackEvent() {
    return (eventType: string, metadata?: Record<string, any>) => {
        analyticsService.trackEvent(eventType, metadata);
    };
}
