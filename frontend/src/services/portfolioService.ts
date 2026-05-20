import { apiRequest } from "../lib/api";

export interface PortfolioItem {
    id: string;
    user_id: number;
    title: string;
    description?: string;
    media_url?: string;
    external_url?: string;
    experience_id?: string;
}

export interface PortfolioItemCreate {
    title: string;
    description?: string;
    media_url?: string;
    external_url?: string;
    experience_id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PortfolioItemUpdate extends Partial<PortfolioItemCreate> { }

const BASE_PATH = "/api/v1/portfolio";

export async function getPortfolio(): Promise<PortfolioItem[]> {
    return apiRequest<PortfolioItem[]>({ method: "get", url: BASE_PATH });
}

export async function createPortfolioItem(data: PortfolioItemCreate): Promise<PortfolioItem> {
    return apiRequest<PortfolioItem>({ method: "post", url: BASE_PATH, data });
}

export async function updatePortfolioItem(id: string, data: PortfolioItemUpdate): Promise<PortfolioItem> {
    return apiRequest<PortfolioItem>({ method: "patch", url: `${BASE_PATH}/${id}`, data });
}

export async function deletePortfolioItem(id: string): Promise<void> {
    return apiRequest<void>({ method: "delete", url: `${BASE_PATH}/${id}` });
}

const portfolioService = {
    getPortfolio,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
};

export default portfolioService;
