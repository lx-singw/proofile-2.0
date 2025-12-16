import { apiRequest } from '@/lib/api';

// Primary types - Opportunity
export interface Opportunity {
    id: number;
    title: string;
    company_name: string;
    location: string;
    description: string;
    created_at: string;
    opportunity_type?: string | null;  // full-time, part-time, contract, internship, learnership
    category?: 'jobs' | 'training_skills_programs';  // NEW: category field
    required_skills?: string[] | null;
    experience_level?: string | null;
    industry?: string | null;
    salary_range?: string | null;
}

export interface OpportunityRecommendation {
    opportunity: Opportunity;
    match_score: number;
    score_breakdown: {
        title_match: number;
        skills_match: number;
        experience_match: number;
        industry_match: number;
        verification_match?: number;
    };
}

export interface OpportunityDetail {
    opportunity: Opportunity;
    is_saved: boolean;
    related_opportunities: Opportunity[];
}

export interface GetOpportunitiesParams {
    skip?: number;
    limit?: number;
    verified_only?: boolean;
    category?: 'jobs' | 'training_skills_programs';
}

export const opportunityService = {
    async getOpportunities(params: GetOpportunitiesParams = {}): Promise<Opportunity[]> {
        return apiRequest<Opportunity[]>({
            method: 'get',
            url: '/api/v1/opportunities/',
            params: {
                skip: params.skip || 0,
                limit: params.limit || 10,
                verified_only: params.verified_only || false,
                category: params.category,
            },
        });
    },

    async getRecommendations(limit: number = 5): Promise<Opportunity[]> {
        return apiRequest<Opportunity[]>({
            method: 'get',
            url: '/api/v1/opportunities/recommendations',
            params: { limit },
        });
    },

    async getAdvancedRecommendations(limit: number = 10): Promise<OpportunityRecommendation[]> {
        return apiRequest<OpportunityRecommendation[]>({
            method: 'get',
            url: '/api/v1/opportunities/recommendations/advanced',
            params: { limit },
        });
    },

    async getOpportunityDetails(opportunityId: number): Promise<OpportunityDetail> {
        return apiRequest<OpportunityDetail>({
            method: 'get',
            url: `/api/v1/opportunities/${opportunityId}`,
        });
    },

    async getSavedOpportunities(): Promise<Opportunity[]> {
        return apiRequest<Opportunity[]>({
            method: 'get',
            url: '/api/v1/opportunities/saved',
        });
    },

    async saveOpportunity(opportunityId: number): Promise<void> {
        await apiRequest({
            method: 'post',
            url: `/api/v1/opportunities/${opportunityId}/save`,
        });
    },

    async unsaveOpportunity(opportunityId: number): Promise<void> {
        await apiRequest({
            method: 'delete',
            url: `/api/v1/opportunities/${opportunityId}/save`,
        });
    },
};

// ============================================================================
// Backward compatibility aliases
// ============================================================================
export type Job = Opportunity;
export type JobRecommendation = OpportunityRecommendation;
export type JobDetail = OpportunityDetail;
export type GetJobsParams = GetOpportunitiesParams;

export const jobService = {
    getJobs: opportunityService.getOpportunities,
    getRecommendations: opportunityService.getRecommendations,
    getAdvancedRecommendations: opportunityService.getAdvancedRecommendations,
    getJobDetails: opportunityService.getOpportunityDetails,
    getSavedJobs: opportunityService.getSavedOpportunities,
    saveJob: opportunityService.saveOpportunity,
    unsaveJob: opportunityService.unsaveOpportunity,
};

