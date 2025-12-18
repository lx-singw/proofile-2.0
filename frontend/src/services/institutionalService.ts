import { apiRequest } from '@/lib/api';

export interface InstitutionalSyncResponse {
    status: string;
    badges_issued: number;
    sources_synced: string[];
    details: Array<{ type: string; ref: string }>;
}

export const institutionalService = {
    /**
     * Initiate sync with HRIS sources (e.g. Workday)
     */
    async syncHrisData(): Promise<InstitutionalSyncResponse> {
        return apiRequest({
            method: 'POST',
            url: '/api/v1/institutional/hris-sync'
        });
    }
};

export default institutionalService;
