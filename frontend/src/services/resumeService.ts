import { apiRequest } from '../lib/api';

export interface ResumeData {
    personal?: {
        name?: string;
        title?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        location?: string; // Deprecated
        linkedin?: string;
        website?: string;
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
        try {
            const blob = await apiRequest<Blob>({
                method: 'post',
                url: `/api/v1/resumes/${id}/export`,
                data: {},
                responseType: 'blob',
            });
            // Check if we got an error response disguised as a blob
            if (blob.type === 'application/json' || blob.size === 0) {
                // Try to parse the blob as JSON to get the error message
                const text = await blob.text();
                console.error('Received JSON/empty response instead of PDF:', text);
                try {
                    const error = JSON.parse(text);
                    throw new Error(error.detail || 'Failed to export PDF');
                } catch {
                    throw new Error('Failed to export PDF: received empty or invalid response');
                }
            }

            return blob;
        } catch (error) {
            console.error('Export PDF error:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        return apiRequest<void>({
            method: 'delete',
            url: `/api/v1/resumes/${id}`,
        });
    },
};

// API for AI Build
export async function startAIBuild(data: {
    target_role?: string;
    job_description?: string;
    style?: string;
    tone?: string;
    length?: string;
    advanced_options?: any;
}): Promise<{ job_id: string; status: string; message: string; estimated_time: number }> {
    return apiRequest({
        method: 'post',
        url: '/api/v1/resume/build',
        data,
    });
}

export async function processAIBuild(job_id: string, data: any): Promise<{ status: string; resume_id: string }> {
    return apiRequest({
        method: 'post',
        url: `/api/v1/resume/build/${job_id}/process`,
        data,
    });
}

// API for resume analysis
export async function getResumeAnalysis(id: string): Promise<any> {
    return apiRequest<any>({
        method: 'get',
        url: `/api/v1/resume/analysis/${id}`,
    });
}

// API for resume upload
export async function uploadResume(file: File | null, text: string | null): Promise<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);
    return apiRequest<any>({
        method: 'post',
        url: '/api/v1/resume/upload',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export async function analyzePublicResume(file: File | null, text: string | null): Promise<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);
    return apiRequest<any>({
        method: 'post',
        url: '/api/v1/resume/public/analyze',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export default resumeService;
