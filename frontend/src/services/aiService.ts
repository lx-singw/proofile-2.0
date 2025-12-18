import { api, apiRequest } from "@/lib/api";

// Types
export interface AIProfileSuggestion {
    id: string;
    type: "headline" | "summary" | "skill" | "experience";
    original?: string;
    suggestion: string;
    reason: string;
    impact: string;
}

export interface AIJobMatch {
    id: string;
    title: string;
    company: string;
    company_logo?: string;
    location: string;
    salary_range?: string;
    posted_at: string;
    match_score: number;
    match_reasons: string[];
    is_remote?: boolean;
    is_featured?: boolean;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

const AI_BASE_PATH = "/api/v1/ai";

// AI Profile Suggestions
export async function getProfileSuggestions(): Promise<AIProfileSuggestion[]> {
    try {
        return await apiRequest<AIProfileSuggestion[]>({
            method: "get",
            url: `${AI_BASE_PATH}/profile-suggestions`,
        });
    } catch (error) {
        console.error("Failed to fetch profile suggestions:", error);
        return [];
    }
}

export async function applyProfileSuggestion(suggestionId: string): Promise<boolean> {
    try {
        await apiRequest({
            method: "post",
            url: `${AI_BASE_PATH}/profile-suggestions/${suggestionId}/apply`,
        });
        return true;
    } catch (error) {
        console.error("Failed to apply suggestion:", error);
        return false;
    }
}

// AI Job Matching
export async function getJobMatches(limit: number = 5): Promise<AIJobMatch[]> {
    try {
        return await apiRequest<AIJobMatch[]>({
            method: "get",
            url: `${AI_BASE_PATH}/job-matches`,
            params: { limit },
        });
    } catch (error) {
        console.error("Failed to fetch job matches:", error);
        return [];
    }
}

const aiService = {
    getProfileSuggestions,
    applyProfileSuggestion,
    getJobMatches,
};

export default aiService;
