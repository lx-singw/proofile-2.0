import { apiRequest } from "@/lib/api";

// ── Rich AI-extracted sub-types ───────────────────────────────────────────────

export interface QualificationLevel {
  degree_level?: string | null; // "Matric" | "Diploma" | "Bachelors" | "Honours" | "Masters" | "PhD"
  field_of_study?: string[] | null;
  specific_subjects?: string[] | null;
  min_percentage?: number | null;
  certifications?: string[] | null;
}

export interface QualificationRequirements {
  minimum?: QualificationLevel | null;
  ideal?: QualificationLevel | null;
}

export interface ExperienceLevel {
  years_min?: number | null;
  years_max?: number | null;
  description?: string | null;
}

export interface ExperienceRequirements {
  minimum?: ExperienceLevel | null;
  ideal?: ExperienceLevel | null;
}

export interface StructuredSkill {
  name: string;
  level: "required" | "preferred" | string;
}

export interface KnowledgeRequirements {
  minimum?: string[] | null;
  ideal?: string[] | null;
}

// ── Spider/Scraper Metadata Types ────────────────────────────────────────────

export interface SpiderEligibility {
  age_min?: number;
  age_max?: number;
  citizenship?: string;
  employment_status?: string;
  disability_friendly?: boolean;
}

export interface SpiderContacts {
  emails?: string[];
  phones?: string[];
}

export interface ExperienceYears {
  min?: number;
  max?: number;
}

export interface ExtraMetadata {
  spider_eligibility?: SpiderEligibility;
  spider_contacts?: SpiderContacts;
  application_method?: string | string[];
  application_warnings?: string[];
  deadline_type?: "ongoing" | "asap" | "fixed" | "unknown";
  salary_string?: string;
  positions_count?: number;
  published_date?: string;
  reference_number?: string;
  sector?: string;
  category?: string;
  education_level?: string;
  experience_years?: ExperienceYears;
  work_arrangement?: string;
  structured_qualifications?: any;
  structured_experience?: any;
  structured_skills?: any;
  structured_knowledge?: any;
}

// ── Primary Opportunity type ──────────────────────────────────────────────────

// Primary types - Opportunity
export interface Opportunity {
  id: number;
  title: string;
  company_name: string;
  location: string;
  description: string;
  created_at: string;
  updated_at?: string;
  opportunity_type?: string | null; // full-time, part-time, contract, internship, learnership
  job_type?: string | null; // backward-compatible alias
  category?: "jobs" | "training_skills_programs"; // NEW: category field
  required_skills?: string[] | null;
  experience_level?: string | null;
  industry?: string | null;
  salary_range?: string | null;
  // Structured salary fields
  salary_min?: number | null;
  salary_max?: number | null;
  salary_visible?: boolean;
  // Remote/work type
  remote_type?: "onsite" | "hybrid" | "remote" | "flexible" | null;
  // Application details
  application_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_website?: string | null;
  contact_address?: string | null;
  contact_whatsapp?: string | null;
  contact_fax?: string | null;
  canonical_link?: string | null;
  is_direct?: boolean;
  is_direct_company_link?: boolean;
  link_quality?: string | null;
  // Dates
  posted_at?: string | null;
  expires_at?: string | null;
  application_deadline_date?: string | null;
  start_date?: string | null;
  duration?: string | null;
  // Verification
  requires_verification_level?: number;
  verified_candidates_only?: boolean;
  // Quality signals
  quality_score?: number | null;
  trust_score?: number | null;
  scam_score?: number | null;
  // Source info
  source?: string | null;
  source_url?: string | null;
  source_platform?: string | null;
  // Employer
  employer_id?: number | null;
  ai_confidence_score?: number | null;
  // Rich AI-extracted fields (sprint5_001)
  benefits?: string[] | null;
  required_documents?: string[] | null;
  tags?: string[] | null;
  red_flags?: string[] | null;
  qualification_requirements?: QualificationRequirements | null;
  experience_requirements?: ExperienceRequirements | null;
  skills_structured?: StructuredSkill[] | null;
  knowledge_requirements?: KnowledgeRequirements | null;
  conditions_of_employment?: string[] | null;
  // Social proof and engagement
  views?: number;
  views_count?: number;
  saves?: number;
  vouch_positive?: number;
  vouch_negative?: number;
  vouches?: number;
  is_verified?: boolean;
  cipc_verified?: boolean;
  // Spider/scraper metadata
  extra_metadata?: ExtraMetadata;
  application_method?: string | string[];
}

export interface OpportunityRecommendation {
  opportunity: Opportunity;
  match_score: number;
  score_breakdown: {
    title_match: number;
    skills_match: number;
    experience_match: number;
    industry_match: number;
    verification_match?: number;
  };
}

export interface OpportunityDetail {
  opportunity: Opportunity;
  is_saved: boolean;
  related_opportunities: Opportunity[];
  // Backward-compatible aliases for legacy consumers
  job?: Opportunity;
  related_jobs?: Opportunity[];
}

export interface GetOpportunitiesParams {
  skip?: number;
  limit?: number;
  verified_only?: boolean;
  category?: "jobs" | "training_skills_programs";
}

export const opportunityService = {
  async getOpportunities(
    params: GetOpportunitiesParams = {},
  ): Promise<Opportunity[]> {
    return apiRequest<Opportunity[]>({
      method: "get",
      url: "/api/v1/opportunities/",
      params: {
        skip: params.skip || 0,
        limit: params.limit || 10,
        verified_only: params.verified_only || false,
        category: params.category,
      },
    });
  },

  async getRecommendations(limit: number = 5): Promise<Opportunity[]> {
    return apiRequest<Opportunity[]>({
      method: "get",
      url: "/api/v1/opportunities/recommendations",
      params: { limit },
    });
  },

  async getAdvancedRecommendations(
    limit: number = 10,
  ): Promise<OpportunityRecommendation[]> {
    return apiRequest<OpportunityRecommendation[]>({
      method: "get",
      url: "/api/v1/opportunities/recommendations/advanced",
      params: { limit },
    });
  },

  async getOpportunityDetails(
    opportunityId: number,
  ): Promise<OpportunityDetail> {
    return apiRequest<OpportunityDetail>({
      method: "get",
      url: `/api/v1/opportunities/${opportunityId}`,
    });
  },

  async getSavedOpportunities(): Promise<Opportunity[]> {
    return apiRequest<Opportunity[]>({
      method: "get",
      url: "/api/v1/opportunities/saved",
    });
  },

  async saveOpportunity(opportunityId: number): Promise<void> {
    await apiRequest({
      method: "post",
      url: `/api/v1/opportunities/${opportunityId}/save`,
    });
  },

  async unsaveOpportunity(opportunityId: number): Promise<void> {
    await apiRequest({
      method: "delete",
      url: `/api/v1/opportunities/${opportunityId}/save`,
    });
  },
};

// ============================================================================
// Backward compatibility aliases
// ============================================================================
export type Job = Opportunity;
export type JobRecommendation = OpportunityRecommendation;
export type JobDetail = OpportunityDetail;
export type GetJobsParams = GetOpportunitiesParams;

export const jobService = {
  getJobs: opportunityService.getOpportunities,
  getRecommendations: opportunityService.getRecommendations,
  getAdvancedRecommendations: opportunityService.getAdvancedRecommendations,
  getJobDetails: async (opportunityId: number): Promise<JobDetail> => {
    const detail =
      await opportunityService.getOpportunityDetails(opportunityId);
    return {
      ...detail,
      job: {
        ...detail.opportunity,
        job_type: detail.opportunity.opportunity_type,
      },
      related_jobs: detail.related_opportunities.map((opportunity) => ({
        ...opportunity,
        job_type: opportunity.opportunity_type,
      })),
    };
  },
  getSavedJobs: async (): Promise<Job[]> => {
    const opportunities = await opportunityService.getSavedOpportunities();
    return opportunities.map((opportunity) => ({
      ...opportunity,
      job_type: opportunity.opportunity_type,
    }));
  },
  saveJob: opportunityService.saveOpportunity,
  unsaveJob: opportunityService.unsaveOpportunity,
};
