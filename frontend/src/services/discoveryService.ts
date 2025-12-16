/**
 * Discovery service: Find and explore professional profiles
 */
import { apiRequest } from "@/lib/api";

// ============ Types ============
export interface DiscoveryProfile {
  id: number;
  username: string | null;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  industry: string | null;
  experience_level: string | null;
  skills: string[];
  followers_count: number;
  stars_count: number;
  average_rating: number | null;
  endorsements_count: number;
  is_verified: boolean;
  is_following: boolean;
  is_starred: boolean;
}

export interface DiscoveryResponse {
  profiles: DiscoveryProfile[];
  total: number;
  page: number;
  page_size: number;
}

export interface IndustryCount {
  industry: string;
  count: number;
}

// ============ Discovery Functions ============
export async function getTrendingProfiles(
  page: number = 1,
  pageSize: number = 10,
  industry?: string
): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (industry) params.set("industry", industry);

  return apiRequest<DiscoveryResponse>({
    url: `/api/v1/discovery/trending?${params.toString()}`,
    method: "GET",
  });
}

export async function getRisingTalent(
  page: number = 1,
  pageSize: number = 10,
  experienceLevel?: string
): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (experienceLevel) params.set("experience_level", experienceLevel);

  return apiRequest<DiscoveryResponse>({
    url: `/api/v1/discovery/rising?${params.toString()}`,
    method: "GET",
  });
}

export async function getTopRatedProfiles(
  page: number = 1,
  pageSize: number = 10,
  industry?: string
): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (industry) params.set("industry", industry);

  return apiRequest<DiscoveryResponse>({
    url: `/api/v1/discovery/top-rated?${params.toString()}`,
    method: "GET",
  });
}

export async function searchProfiles(
  query: string,
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    industry?: string;
    experience_level?: string;
  }
): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (filters?.industry) params.set("industry", filters.industry);
  if (filters?.experience_level)
    params.set("experience_level", filters.experience_level);

  return apiRequest<DiscoveryResponse>({
    url: `/api/v1/discovery/search?${params.toString()}`,
    method: "GET",
  });
}

export async function getProfilesByIndustry(
  industry: string,
  page: number = 1,
  pageSize: number = 10
): Promise<DiscoveryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  return apiRequest<DiscoveryResponse>({
    url: `/api/v1/discovery/by-industry/${encodeURIComponent(industry)}?${params.toString()}`,
    method: "GET",
  });
}

export async function getAvailableIndustries(): Promise<IndustryCount[]> {
  return apiRequest<IndustryCount[]>({
    url: "/api/v1/discovery/industries",
    method: "GET",
  });
}

// Export as default object for convenience
export const discoveryService = {
  getTrendingProfiles,
  getRisingTalent,
  getTopRatedProfiles,
  searchProfiles,
  getProfilesByIndustry,
  getAvailableIndustries,
};
