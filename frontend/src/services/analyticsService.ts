import { api, apiRequest } from "@/lib/api";

// Types
export interface MetricData {
    label: string;
    value: string | number;
    change: number;
    changeLabel: string;
}

export interface ProfileViewsData {
    date: string;
    views: number;
}

export interface AnalyticsSummary {
    totalViews: number;
    searchAppearances: number;
    connections: number;
    avgRating: number;
    viewsTrend: ProfileViewsData[];
    topReferrers: { source: string; count: number }[];
}

export interface CareerInsight {
    id: string;
    type: "trend" | "opportunity" | "skill_gap" | "milestone";
    title: string;
    description: string;
    actionUrl?: string;
    actionLabel?: string;
}

const ANALYTICS_BASE_PATH = "/api/v1/analytics";

// Profile Analytics
export async function getAnalyticsSummary(period: "7d" | "30d" | "90d" = "7d"): Promise<AnalyticsSummary | null> {
    try {
        return await apiRequest<AnalyticsSummary>({
            method: "get",
            url: `${ANALYTICS_BASE_PATH}/summary`,
            params: { period },
        });
    } catch (error) {
        console.error("Failed to fetch analytics summary:", error);
        return null;
    }
}

export async function getProfileViews(period: "7d" | "30d" = "7d"): Promise<ProfileViewsData[]> {
    try {
        return await apiRequest<ProfileViewsData[]>({
            method: "get",
            url: `${ANALYTICS_BASE_PATH}/views`,
            params: { period },
        });
    } catch (error) {
        console.error("Failed to fetch profile views:", error);
        return [];
    }
}

// Career Insights
export async function getCareerInsights(): Promise<CareerInsight[]> {
    try {
        return await apiRequest<CareerInsight[]>({
            method: "get",
            url: `${ANALYTICS_BASE_PATH}/insights`,
        });
    } catch (error) {
        console.error("Failed to fetch career insights:", error);
        return [];
    }
}

// Track Events
export async function trackEvent(eventType: string, metadata?: Record<string, any>): Promise<void> {
    try {
        await apiRequest({
            method: "post",
            url: `${ANALYTICS_BASE_PATH}/events`,
            data: { eventType, metadata, timestamp: new Date().toISOString() },
        });
    } catch (error) {
        console.error("Failed to track event:", error);
    }
}

const analyticsService = {
    getAnalyticsSummary,
    getProfileViews,
    getCareerInsights,
    trackEvent,
};

export default analyticsService;
