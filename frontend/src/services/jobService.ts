import { apiRequest } from '@/lib/api';

export interface Job {
    id: number;
    title: string;
    company_name: string;
    location: string;
    description: string;
    created_at: string;
}

export const jobService = {
    async getRecommendations(limit: number = 5): Promise<Job[]> {
        return apiRequest<Job[]>({
            method: 'get',
            url: '/api/v1/jobs/recommendations',
            params: { limit },
        });
    },
};
