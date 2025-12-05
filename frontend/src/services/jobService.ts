import { apiRequest } from '@/lib/api';

export interface Job {
    id: number;
    title: string;
    company_name: string;
    location: string;
    description: string;
    created_at: string;
    job_type?: string | null;
    required_skills?: string[] | null;
    experience_level?: string | null;
    industry?: string | null;
    salary_range?: string | null;
}

export interface JobRecommendation {
    job: Job;
    match_score: number;
    score_breakdown: {
        title_match: number;
        skills_match: number;
        experience_match: number;
        industry_match: number;
    };
}

export interface JobDetail {
    job: Job;
    is_saved: boolean;
    related_jobs: Job[];
}

export const jobService = {
    async getRecommendations(limit: number = 5): Promise<Job[]> {
        return apiRequest<Job[]>({
            method: 'get',
            url: '/api/v1/jobs/recommendations',
            params: { limit },
        });
    },

    async getAdvancedRecommendations(limit: number = 10): Promise<JobRecommendation[]> {
        return apiRequest<JobRecommendation[]>({
            method: 'get',
            url: '/api/v1/jobs/recommendations/advanced',
            params: { limit },
        });
    },

    async getJobDetails(jobId: number): Promise<JobDetail> {
        return apiRequest<JobDetail>({
            method: 'get',
            url: `/api/v1/jobs/${jobId}`,
        });
    },

    async getSavedJobs(): Promise<Job[]> {
        return apiRequest<Job[]>({
            method: 'get',
            url: '/api/v1/jobs/saved',
        });
    },

    async saveJob(jobId: number): Promise<void> {
        await apiRequest({
            method: 'post',
            url: `/api/v1/jobs/${jobId}/save`,
        });
    },

    async unsaveJob(jobId: number): Promise<void> {
        await apiRequest({
            method: 'delete',
            url: `/api/v1/jobs/${jobId}/save`,
        });
    },
};
