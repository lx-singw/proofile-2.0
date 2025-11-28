import { apiRequest } from '../lib/api';

export interface ResumeData {
    personal?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        summary?: string;
    };
    experience?: Array<{
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        description: string;
    }>;
    education?: Array<{
        institution: string;
        degree: string;
        field: string;
        graduationDate: string;
    }>;
    skills?: string[];
}

export interface Resume {
    id: string;
    name: string;
    template_id: string;
    data: ResumeData;
    created_at: string;
    updated_at: string;
}

export const resumeService = {
    async create(name: string, template_id: string, data: ResumeData): Promise<Resume> {
        return apiRequest<Resume>({
            method: 'post',
            url: '/api/v1/resumes',
            data: {
                name,
                template_id,
                data,
            },
        });
    },

    async update(id: string, updates: Partial<{ name: string; template_id: string; data: ResumeData }>): Promise<Resume> {
        return apiRequest<Resume>({
            method: 'put',
            url: `/api/v1/resumes/${id}`,
            data: updates,
        });
    },

    async get(id: string): Promise<Resume> {
        return apiRequest<Resume>({
            method: 'get',
            url: `/api/v1/resumes/${id}`,
        });
    },

    async list(): Promise<Resume[]> {
        return apiRequest<Resume[]>({
            method: 'get',
            url: '/api/v1/resumes',
        });
    },

    async exportPDF(id: string): Promise<Blob> {
        // apiRequest expects JSON by default, so we need to override for blob
        // We can't use apiRequest easily for blobs if it assumes JSON response in its wrapper
        // But looking at apiRequest implementation:
        // const resp = await api.request<T>(config); return resp.data;
        // It should work if T is Blob and we pass responseType: 'blob' in config.
        return apiRequest<Blob>({
            method: 'post',
            url: `/api/v1/resumes/${id}/export`,
            data: {},
            responseType: 'blob',
        });
    },
};
