import { apiRequest } from '@/lib/api';

export interface UserStats {
    resumes_count: number;
    verifications_count: number;
    ratings_count: number;
    saved_jobs_count: number;
}

export const statsService = {
    async getUserStats(): Promise<UserStats> {
        return apiRequest<UserStats>({
            method: 'get',
            url: '/api/v1/users/me/stats',
        });
    },
};
