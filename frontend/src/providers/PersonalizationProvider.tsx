"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// =============================================================================
// Types
// =============================================================================

export interface PersonalizationContext {
    // Dimension 1: Opportunity Category
    opportunity_preference: "jobs" | "training_skills_programs" | "both" | null;

    // Dimension 2: User Persona
    persona: string | null;

    // Dimension 3: Industry/Sector
    primary_industry: string | null;

    // Dimension 4: Experience Level
    experience_level: string | null;
    years_experience: number | null;

    // Dimension 5: Location/Province
    province: string | null;
    city: string | null;
    willing_to_relocate: boolean;

    // Dimension 6: Career Intent
    career_intent: string | null;
    available_from: string | null;
    notice_period_weeks: number | null;

    // Dimension 7: Verification Level
    trust_score: number;
    verification_level: string;

    // Dimension 8: Skills
    skills: string[];

    // Dimension 9: Salary Expectations
    salary_expectation_min: number | null;
    salary_expectation_max: number | null;
    salary_negotiable: boolean;

    // Dimension 10: Work Mode
    work_mode_preference: string | null;
    max_commute_minutes: number | null;

    // Dimension 11: Engagement
    engagement_pattern: string;
}

export interface PersonalizationUpdate {
    province?: string;
    city?: string;
    willing_to_relocate?: boolean;
    career_intent?: string;
    available_from?: string;
    notice_period_weeks?: number;
    salary_expectation_min?: number;
    salary_expectation_max?: number;
    salary_negotiable?: boolean;
    work_mode_preference?: string;
    max_commute_minutes?: number;
    years_experience?: number;
    opportunity_preference?: "jobs" | "training_skills_programs" | "both";
}

interface PersonalizationContextType {
    context: PersonalizationContext | null;
    isLoading: boolean;
    error: string | null;
    updatePreferences: (updates: PersonalizationUpdate) => Promise<void>;
    refreshContext: () => Promise<void>;
}

// =============================================================================
// Context
// =============================================================================

const PersonalizationCtx = createContext<PersonalizationContextType | null>(
    null
);

// =============================================================================
// Provider
// =============================================================================

interface PersonalizationProviderProps {
    children: ReactNode;
}

export function PersonalizationProvider({
    children,
}: PersonalizationProviderProps) {
    const { user, loading: authLoading } = useAuth();
    const [context, setContext] = useState<PersonalizationContext | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadContext = async () => {
        // Don't fetch if user is not authenticated
        if (!user) {
            setIsLoading(false);
            setContext(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const data = await apiRequest<PersonalizationContext>({
                url: "/api/v1/personalization/context",
                method: "GET",
            });
            setContext(data);
        } catch (err) {
            console.error("Failed to load personalization context:", err);
            setError("Failed to load preferences");
        } finally {
            setIsLoading(false);
        }
    };

    const updatePreferences = async (updates: PersonalizationUpdate) => {
        try {
            const data = await apiRequest<PersonalizationContext>({
                url: "/api/v1/personalization/preferences",
                method: "PATCH",
                data: updates,
            });
            setContext(data);
        } catch (err) {
            console.error("Failed to update preferences:", err);
            throw err;
        }
    };

    useEffect(() => {
        // Wait for auth to finish loading before attempting to load context
        if (!authLoading) {
            loadContext();
        }
    }, [user, authLoading]);

    return (
        <PersonalizationCtx.Provider
            value={{
                context,
                isLoading,
                error,
                updatePreferences,
                refreshContext: loadContext,
            }}
        >
            {children}
        </PersonalizationCtx.Provider>
    );
}

// =============================================================================
// Hook
// =============================================================================

export function usePersonalization() {
    const ctx = useContext(PersonalizationCtx);
    if (!ctx) {
        throw new Error(
            "usePersonalization must be used within a PersonalizationProvider"
        );
    }
    return ctx;
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Get the category label for display
 */
export function useCategoryLabel() {
    const { context } = usePersonalization();

    if (context?.opportunity_preference === "jobs") {
        return "Jobs & Careers";
    } else if (context?.opportunity_preference === "training_skills_programs") {
        return "Training & Skills Programs";
    }
    return "All Opportunities";
}

/**
 * Check if user is in specific category
 */
export function useIsCategory(
    category: "jobs" | "training_skills_programs" | "both"
) {
    const { context } = usePersonalization();
    return (
        context?.opportunity_preference === category ||
        context?.opportunity_preference === "both"
    );
}

/**
 * Get verification display info
 */
export function useVerificationInfo() {
    const { context } = usePersonalization();

    const levelColors: Record<string, string> = {
        unverified: "gray",
        basic: "blue",
        standard: "indigo",
        verified: "emerald",
        premium: "amber",
    };

    return {
        level: context?.verification_level || "unverified",
        score: context?.trust_score || 0,
        color: levelColors[context?.verification_level || "unverified"],
    };
}
