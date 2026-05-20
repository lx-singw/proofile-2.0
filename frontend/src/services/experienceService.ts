import { apiRequest } from "../lib/api";

export interface Experience {
    id: string;
    user_id: number;
    company: string;
    title: string;
    location?: string;
    start_date: string;
    end_date?: string;
    description?: string;
    is_current: boolean;
    is_verified: boolean;
}

export interface ExperienceCreate {
    company: string;
    title: string;
    location?: string;
    start_date: string;
    end_date?: string;
    description?: string;
    is_current: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExperienceUpdate extends Partial<ExperienceCreate> { }

const BASE_PATH = "/api/v1/experience";

export async function getExperiences(): Promise<Experience[]> {
    return apiRequest<Experience[]>({ method: "get", url: BASE_PATH });
}

export async function createExperience(data: ExperienceCreate): Promise<Experience> {
    return apiRequest<Experience>({ method: "post", url: BASE_PATH, data });
}

export async function updateExperience(id: string, data: ExperienceUpdate): Promise<Experience> {
    return apiRequest<Experience>({ method: "patch", url: `${BASE_PATH}/${id}`, data });
}

export async function deleteExperience(id: string): Promise<void> {
    return apiRequest<void>({ method: "delete", url: `${BASE_PATH}/${id}` });
}

const experienceService = {
    getExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
};

export default experienceService;
