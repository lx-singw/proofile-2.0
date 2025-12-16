/**
 * Portal Service
 * 
 * Frontend service for public jobs portal API integration.
 * No authentication required for most endpoints.
 * 
 * Uses relative URLs which are proxied to backend via Next.js rewrites.
 * This ensures requests work in Docker/WSL environments.
 */
import axios from "axios";

// Use relative URL - Next.js rewrites will proxy /api/* to backend
const api = axios.create({
    baseURL: "/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Types
export interface PortalJobCard {
    id: number;
    slug?: string;
    title: string;
    company: string;
    company_logo_url?: string;
    location?: string;
    location_type?: string;
    salary_display?: string;
    skills?: string[];
    experience_level?: string;
    category?: string;
    job_type?: string;
    is_remote: boolean;
    posted_at?: string;
    source: string;
}

export interface PortalJobDetail extends PortalJobCard {
    description?: string;
    description_html?: string;
    source_url?: string;
    education_requirement?: string;
    years_experience_min?: number;
    years_experience_max?: number;
    expires_at?: string;
    views_count: number;
    applies_count: number;
    related_jobs: PortalJobCard[];
}

export interface FacetItem {
    value: string;
    label: string;
    count: number;
}

export interface PortalFacets {
    categories: FacetItem[];
    locations: FacetItem[];
    experience_levels: FacetItem[];
    job_types: FacetItem[];
    sources: FacetItem[];
}

export interface PortalSearchResponse {
    jobs: PortalJobCard[];
    total: number;
    page: number;
    size: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
    facets?: PortalFacets;
}

export interface PortalSearchParams {
    q?: string;
    location?: string;
    location_type?: string;
    category?: string;
    experience_level?: string;
    job_type?: string;
    salary_min?: number;
    salary_max?: number;
    source?: string;
    posted_within_days?: number;
    page?: number;
    size?: number;
    sort_by?: "posted_at" | "salary_max" | "views_count";
    sort_order?: "asc" | "desc";
}

export interface PortalStats {
    total_jobs: number;
    total_companies: number;
    remote_jobs: number;
}

// Portal API
export const portalService = {
    /**
     * Search jobs in the public portal
     */
    async searchJobs(params?: PortalSearchParams): Promise<PortalSearchResponse> {
        const response = await api.get("/portal/jobs", { params });
        return response.data;
    },

    /**
     * Get job details by ID
     */
    async getJobById(jobId: number): Promise<PortalJobDetail> {
        const response = await api.get(`/portal/jobs/${jobId}`);
        return response.data;
    },

    /**
     * Get job details by slug
     */
    async getJobBySlug(slug: string): Promise<PortalJobDetail> {
        const response = await api.get(`/portal/jobs/slug/${slug}`);
        return response.data;
    },

    /**
     * Get featured/verified jobs
     */
    async getFeaturedJobs(limit = 10): Promise<PortalJobCard[]> {
        const response = await api.get("/portal/featured", { params: { limit } });
        return response.data;
    },

    /**
     * Get trending jobs
     */
    async getTrendingJobs(limit = 10): Promise<PortalJobCard[]> {
        const response = await api.get("/portal/trending", { params: { limit } });
        return response.data;
    },

    /**
     * Get recently posted jobs
     */
    async getRecentJobs(limit = 20): Promise<PortalJobCard[]> {
        const response = await api.get("/portal/recent", { params: { limit } });
        return response.data;
    },

    /**
     * Get job categories with counts
     */
    async getCategories(): Promise<FacetItem[]> {
        const response = await api.get("/portal/categories");
        return response.data;
    },

    /**
     * Get portal statistics
     */
    async getStats(): Promise<PortalStats> {
        const response = await api.get("/portal/stats");
        return response.data;
    },

    /**
     * Record when user clicks apply
     */
    async recordApplyClick(jobId: number, applyType: "external" | "proofile" = "external"): Promise<{
        status: string;
        apply_type: string;
        redirect?: string;
    }> {
        const response = await api.post(`/portal/jobs/${jobId}/apply`, {
            job_id: jobId,
            apply_type: applyType,
        });
        return response.data;
    },
};

export default portalService;
