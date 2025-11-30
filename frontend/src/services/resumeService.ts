import { apiRequest } from '../lib/api';
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
        try {
            const blob = await apiRequest<Blob>({
                method: 'post',
                url: `/api/v1/resumes/${id}/export`,
                data: {},
                responseType: 'blob',
            });
            console.log('PDF Blob received:', blob);
            console.log('PDF Blob size:', blob.size);
            console.log('PDF Blob type:', blob.type);

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

    async uploadResume(file?: File, text?: string): Promise<Resume> {
        const formData = new FormData();
        if (file) formData.append("file", file);
        if (text) formData.append("text", text);
        const res = await axios.post(`${API_BASE}/resume/upload`, formData);
        return res.data;
    },

    async getResumeAnalysis(resumeId: string | number): Promise<Resume> {
        const res = await axios.get(`${API_BASE}/resume/${resumeId}`);
        return res.data;
    },
};
