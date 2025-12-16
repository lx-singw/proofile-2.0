import { apiRequest } from '@/lib/api';

export interface Activity {
    id: number;
    action_type: string;
    description: string;
    created_at: string;
}

export const activityService = {
    async getRecentActivities(limit: number = 10): Promise<Activity[]> {
        return apiRequest<Activity[]>({
            method: 'get',
            url: '/api/v1/activities/recent',
            params: { limit },
        });
    },
};
