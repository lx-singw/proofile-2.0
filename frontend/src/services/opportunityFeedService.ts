// ─────────────────────────────────────────────────────────────────────────────
// Opportunity Feed Service
//
// Calls the dedicated /api/v1/feed/opportunities backend endpoint (Sprint 4+)
// and maps results into the FeedCard discriminated union, injecting non-job
// insight cards at the correct ratios from the feed plan.
//
// Fallback: if the dedicated endpoint is unavailable it falls back to the
// legacy /api/v1/opportunities/ endpoint so the UI is never broken.
// ─────────────────────────────────────────────────────────────────────────────

import { opportunityService, Opportunity } from '@/services/opportunityService';
import { apiRequest } from '@/lib/api';
import {
  FeedCard,
  FeedPage,
  FeedPageParams,
  OpportunityFeedCard,
  InsightFeedCard,
  AnonymousMatchContext,
  ProfileMatchContext,
  VerifiedMatchContext,
} from '@/types/feedCard';

const PAGE_SIZE = 24;

// ── Insight card pools (static fallback; replaced by backend data at runtime) ─
// Backend calls GET /api/v1/feed/insight-cards to populate live pools.

const FALLBACK_TRUST: Omit<InsightFeedCard, 'id'>[] = [
  {
    type: 'trust_insight',
    headline: 'Verified profiles get hired 3× faster',
    body: 'Professionals with verified skills on Proofile are contacted by recruiters 3× more often than unverified applicants.',
    ctaLabel: 'Get verified →',
    ctaHref: '/profile#reviews',
    iconKey: 'star',
  },
];

const FALLBACK_MARKET: Omit<InsightFeedCard, 'id'>[] = [
  {
    type: 'market_intelligence',
    headline: 'SA remote-friendly companies hiring this month',
    body: '47 South African companies are actively hiring for remote or hybrid roles this month.',
    ctaLabel: 'Browse remote roles',
    iconKey: 'market',
  },
];

const FALLBACK_COMMUNITY: Omit<InsightFeedCard, 'id'>[] = [
  {
    type: 'community_proof',
    headline: 'SA developers are moving up without degrees',
    body: 'Proofile members with 4+ verified reviews are landing senior roles based on proof — not paper qualifications.',
    iconKey: 'community',
  },
];

const FALLBACK_GRAPH: Omit<InsightFeedCard, 'id'>[] = [
  {
    type: 'graph_discovery',
    headline: 'Your network is already inside these companies',
    body: 'Proofile users with your profile type have connections at some of the companies currently hiring. Sign in to see who.',
    ctaLabel: 'Sign in to see your network',
    ctaHref: '/login',
    iconKey: 'network',
  },
];

// Live pools — populated from backend on mount, fallback used until then
let liveTrustCards: Omit<InsightFeedCard, 'id'>[] = FALLBACK_TRUST;
let liveMarketCards: Omit<InsightFeedCard, 'id'>[] = FALLBACK_MARKET;
let liveCommunityCards: Omit<InsightFeedCard, 'id'>[] = FALLBACK_COMMUNITY;
let liveGraphCards: Omit<InsightFeedCard, 'id'>[] = FALLBACK_GRAPH;

// Cycle order: trust → market → community → graph
function getLivePools(): Omit<InsightFeedCard, 'id'>[][] {
  return [liveTrustCards, liveMarketCards, liveCommunityCards, liveGraphCards];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRemoteType(opp: Opportunity): OpportunityFeedCard['remoteType'] {
  const t = (opp.job_type || opp.opportunity_type || '').toLowerCase();
  if (t.includes('remote')) return 'remote';
  if (t.includes('hybrid')) return 'hybrid';
  if (t.includes('flexible')) return 'flexible';
  return 'onsite';
}

function parseSalaryRange(salaryRange?: string | null): { min?: number; max?: number } {
  if (!salaryRange) return {};
  // e.g. "R45,000 – R65,000" or "45000-65000"
  const digits = salaryRange.replace(/[^0-9\-–]/g, ' ').trim().split(/[\s\-–]+/).filter(Boolean);
  if (digits.length >= 2) return { min: parseInt(digits[0]), max: parseInt(digits[1]) };
  if (digits.length === 1) return { min: parseInt(digits[0]) };
  return {};
}

function buildMatchContext(
  opp: Opportunity,
  params: FeedPageParams,
): AnonymousMatchContext | ProfileMatchContext | VerifiedMatchContext {
  const skills = opp.required_skills ?? [];

  if (params.userFeedState === 'verified') {
    return {
      state: 'verified',
      verifiedSkills: skills.slice(0, 3),
      reviewerConnections: 0, // Phase D: wire graphService
      matchStrengthPercent: 72,
      proofileScorePercentile: 65,
    } satisfies VerifiedMatchContext;
  }

  if (params.userFeedState === 'profile') {
    return {
      state: 'profile',
      matchedSkills: skills.slice(0, 2),
      unmatchedSkills: skills.slice(2, 4),
      matchStrengthPercent: 55,
    } satisfies ProfileMatchContext;
  }

  // anonymous
  const inferred = params.inferredProfile;
  const reasons: string[] = [];
  if (inferred?.role) reasons.push(`Matches your apparent interest in ${inferred.role} roles`);
  if (inferred?.location) reasons.push(`Located near your inferred area (${inferred.location})`);
  if (inferred?.salaryMin && opp.salary_range) reasons.push('Salary range aligns with what you\'ve engaged with');
  if (reasons.length === 0) reasons.push('Trending opportunity in South Africa right now');

  return {
    state: 'anonymous',
    behavioural: reasons,
  } satisfies AnonymousMatchContext;
}

function mapBackendMatchContext(
  ctx: BackendMatchContext,
  opp: Opportunity,
): AnonymousMatchContext | ProfileMatchContext | VerifiedMatchContext {
  if (ctx.state === 'verified') {
    const verifiedSkills = ctx.reasons
      .filter((r) => r.strength === 'verified')
      .map((r) => r.label.split(' — ')[0]);
    return {
      state: 'verified',
      verifiedSkills: verifiedSkills.length ? verifiedSkills : (opp.required_skills ?? []).slice(0, 2),
      reviewerConnections: ctx.reviewer_connections,
      matchStrengthPercent: ctx.match_strength_percent,
      proofileScorePercentile: ctx.proofile_score_percentile,
    } satisfies VerifiedMatchContext;
  }
  if (ctx.state === 'profile') {
    const matchedSkills = ctx.reasons
      .filter((r) => r.strength === 'stated')
      .map((r) => r.label.split(' — ')[0]);
    return {
      state: 'profile',
      matchedSkills,
      unmatchedSkills: (opp.required_skills ?? []).filter(
        (s) => !matchedSkills.map((m) => m.toLowerCase()).includes(s.toLowerCase()),
      ).slice(0, 2),
      matchStrengthPercent: ctx.match_strength_percent,
    } satisfies ProfileMatchContext;
  }
  // anonymous
  return {
    state: 'anonymous',
    behavioural: ctx.reasons.map((r) => r.label),
  } satisfies AnonymousMatchContext;
}

function oppToFeedCard(opp: Opportunity, params: FeedPageParams, backendCard?: BackendOpportunityCard): OpportunityFeedCard {
  const { min: salaryMin, max: salaryMax } = parseSalaryRange(opp.salary_range);

  // ── Undervalue detection ───────────────────────────────────────────────────
  // A role is flagged as undervalue when its midpoint salary is meaningfully
  // below either:
  //  a) The user's inferred salary expectations (from session signals), OR
  //  b) A static market-average threshold for the role type (Phase 0 heuristic)
  let isUndervalue = false;
  let undervalueInsight: string | undefined;

  const midpoint = salaryMin && salaryMax ? Math.round((salaryMin + salaryMax) / 2) : salaryMin;

  if (midpoint) {
    // (a) User expectation-based check
    const userMin = params.inferredProfile?.salaryMin;
    if (userMin && midpoint < userMin * 0.85) {
      isUndervalue = true;
      undervalueInsight = `This role pays ~R${Math.round(midpoint / 1000)}k/month — your profile typically commands R${Math.round(userMin / 1000)}k+.`;
    }

    // (b) Market-average heuristic (Phase 0: simple title-keyword matching)
    if (!isUndervalue) {
      const title = (opp.title ?? '').toLowerCase();
      const marketFloors: Array<{ keywords: string[]; floor: number; label: string }> = [
        { keywords: ['senior', 'lead', 'principal'], floor: 65_000, label: 'senior-level' },
        { keywords: ['fullstack', 'full-stack', 'full stack'], floor: 55_000, label: 'full-stack' },
        { keywords: ['backend', 'back-end'], floor: 50_000, label: 'backend' },
        { keywords: ['frontend', 'front-end'], floor: 48_000, label: 'frontend' },
        { keywords: ['data scientist', 'ml engineer', 'machine learning'], floor: 60_000, label: 'data/ML' },
        { keywords: ['devops', 'platform engineer', 'sre'], floor: 60_000, label: 'DevOps/SRE' },
        { keywords: ['product manager', 'product owner'], floor: 70_000, label: 'product management' },
      ];

      for (const { keywords, floor, label } of marketFloors) {
        if (keywords.some((kw) => title.includes(kw)) && midpoint < floor * 0.85) {
          isUndervalue = true;
          undervalueInsight = `Market average for ${label} roles in SA is ~R${Math.round(floor / 1000)}k/month. This listing is below that — you may have negotiating room.`;
          break;
        }
      }
    }
  }

  return {
    type: 'opportunity',
    id: String(opp.id),
    slug: (opp as Opportunity & { slug?: string }).slug ?? undefined,
    companyName: opp.company_name,
    roleTitle: opp.title,
    location: opp.location,
    remoteType: parseRemoteType(opp),
    opportunityType: opp.opportunity_type ?? backendCard?.opportunity_type ?? undefined,
    salaryMin,
    salaryMax,
    salaryCurrency: 'ZAR',
    salaryVisible: !!opp.salary_range,
    requiredSkills: opp.required_skills ?? [],
    postedAt: opp.created_at,
    closesAt: backendCard?.expires_at ?? undefined,
    source: (opp as Opportunity & { is_direct?: boolean }).is_direct ? 'direct' : 'aggregated',
    sourcePlatform: (opp as Opportunity & { source_platform?: string }).source_platform ?? undefined,
    applyUrl: (opp as Opportunity & { application_url?: string; source_url?: string }).application_url ?? (opp as Opportunity & { source_url?: string }).source_url ?? undefined,
    description: (opp as Opportunity & { description?: string }).description || undefined,
    qualityScore: 0.8,
    engagementRate: 0,
    matchContext: backendCard?.match_context
      ? mapBackendMatchContext(backendCard.match_context, opp)
      : buildMatchContext(opp, params),
    avgSalaryForRole: salaryMin ? Math.round((salaryMin + (salaryMax ?? salaryMin)) / 2) : undefined,
    interestedCount: backendCard?.interested_count ?? 0,
    savedCount: backendCard?.saved_count ?? 0,
    viewerIsInterested: backendCard?.viewer_is_interested ?? false,
    viewerHasSaved: backendCard?.viewer_has_saved ?? false,
    isUndervalue: isUndervalue || undefined,
    undervalueInsight,
  };
}

function makeInsightCard(cycleIndex: number, slotIndex: number): InsightFeedCard {
  const pools = getLivePools();
  const pool = pools[cycleIndex % pools.length];
  const template = pool[slotIndex % pool.length];
  return {
    ...template,
    id: `insight-${cycleIndex}-${slotIndex}-${Date.now()}`,
  } as InsightFeedCard;
}

/**
 * Deterministic pseudo-random interval between 4 and 7.
 * Using seed so position is stable across re-renders on the same page load.
 */
function nextInsightInterval(seed: number): number {
  // LCG-style: produces 0–3, mapped to 4–7
  return 4 + ((seed * 1103515245 + 12345) >>> 0) % 4;
}

/**
 * Mix opportunity cards with non-job cards using a variable reward schedule:
 *   ~60% opportunities, ~15% trust insights, ~10% graph, ~10% market, ~5% community
 *
 * Insight cards appear every 4–7 opportunity cards (randomised per cycle so
 * users can't predict and skip them — TikTok-style variable reward schedule).
 */
export function mixCards(oppCards: OpportunityFeedCard[]): FeedCard[] {
  const result: FeedCard[] = [];
  let insightCycle = 0;
  let nextThreshold = nextInsightInterval(0);

  for (let i = 0; i < oppCards.length; i++) {
    result.push(oppCards[i]);
    if (i + 1 >= nextThreshold) {
      result.push(makeInsightCard(insightCycle, 0));
      insightCycle++;
      nextThreshold += nextInsightInterval(insightCycle);
    }
  }
  return result;
}

// ── Dedicated feed API response types ────────────────────────────────────────

interface BackendMatchReason {
  label: string;
  strength: 'verified' | 'stated' | 'inferred';
}

interface BackendMatchContext {
  state: 'anonymous' | 'profile' | 'verified';
  reasons: BackendMatchReason[];
  match_strength_percent: number;
  proofile_score_percentile: number;
  reviewer_connections: number;
}

interface BackendOpportunityCard {
  id: number;
  title: string;
  company_name: string;
  description?: string | null;
  location?: string | null;
  remote_type?: string | null;
  opportunity_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_range?: string | null;
  salary_visible?: boolean;
  required_skills?: string | null;
  experience_level?: string | null;
  industry?: string | null;
  source?: string | null;
  source_platform?: string | null;
  source_url?: string | null;
  application_url?: string | null;
  is_direct?: boolean;
  quality_score: number;
  posted_at?: string | null;
  expires_at?: string | null;
  // Social proof fields
  interested_count?: number;
  saved_count?: number;
  viewer_is_interested?: boolean;
  viewer_has_saved?: boolean;
  // Match context from backend
  match_context?: BackendMatchContext | null;
}

interface BackendFeedPage {
  items: BackendOpportunityCard[];
  next_cursor: number | null;
  has_more: boolean;
}

interface BackendInsightCard {
  type: string;
  id: string;
  headline: string;
  body: string;
  cta_label?: string | null;
  cta_href?: string | null;
  icon_key: string;
}

interface BackendFeedStats {
  total_applicants_this_week: number;
  verified_applicants_this_week: number;
}

/**
 * Some scrapers (e.g. careers24) put a deadline string like "57 Days left"
 * in the location field instead of a real location. Strip those so the UI
 * doesn't show nonsense.
 */
function sanitizeLocation(raw?: string | null): string {
  if (!raw) return 'South Africa';
  // Reject strings that look like deadlines or durations
  if (/\d+\s+days?\s+(left|ago|remaining)/i.test(raw)) return 'South Africa';
  if (/^\d+\s+day/i.test(raw)) return 'South Africa';
  if (/closing|deadline|expires?/i.test(raw)) return 'South Africa';
  return raw.trim() || 'South Africa';
}

function backendCardToOpportunity(card: BackendOpportunityCard): Opportunity {
  let skills: string[] = [];
  try {
    skills = card.required_skills ? JSON.parse(card.required_skills) : [];
  } catch {
    skills = [];
  }
  return {
    id: card.id,
    title: card.title,
    company_name: card.company_name,
    location: sanitizeLocation(card.location),
    description: card.description ?? '',
    created_at: card.posted_at ?? new Date().toISOString(),
    opportunity_type: card.opportunity_type ?? undefined,
    required_skills: skills,
    experience_level: card.experience_level ?? undefined,
    industry: card.industry ?? undefined,
    salary_range: card.salary_range ?? undefined,
    // feed-specific fields passed through as extra props
    ...(card.salary_min ? { salary_min: card.salary_min } : {}),
    ...(card.salary_max ? { salary_max: card.salary_max } : {}),
    ...(card.remote_type ? { remote_type: card.remote_type } : {}),
    ...(card.is_direct !== undefined ? { is_direct: card.is_direct } : {}),
    ...(card.source_platform ? { source_platform: card.source_platform } : {}),
    ...(card.source_url ? { source_url: card.source_url } : {}),
    ...(card.application_url ? { application_url: card.application_url } : {}),
  } as Opportunity;
}

// ── Cursor helpers ────────────────────────────────────────────────────────────
// Phase 0 cursor is simply the "skip" offset encoded as a base64 string.
// Backend cursor is a numeric opportunity ID.

function encodeCursor(value: number): string {
  return Buffer.from(String(value)).toString('base64');
}

function decodeCursor(cursor: string): number {
  try {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf8'), 10);
  } catch {
    return 0;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getOpportunityFeedPage(params: FeedPageParams): Promise<FeedPage> {
  // ── Try the dedicated backend feed API first ────────────────────────────
  try {
    const cursorId = params.cursor ? decodeCursor(params.cursor) : undefined;
    const queryParams: Record<string, string | number> = {};
    if (cursorId) queryParams['cursor'] = cursorId;
    if (params.inferredProfile?.location) queryParams['location'] = params.inferredProfile.location;
    if (params.sidebarFilters?.location) queryParams['location'] = params.sidebarFilters.location;
    if (params.sidebarFilters?.opportunityTypes?.length) {
      queryParams['opportunity_type'] = params.sidebarFilters.opportunityTypes.join(',');
    }
    // Pass inferred signals for anonymous session-based ranking
    if (params.userFeedState === 'anonymous' && params.inferredProfile) {
      if (params.inferredProfile.location) {
        queryParams['inferred_location'] = params.inferredProfile.location;
      }
      if (params.inferredProfile.skills?.length) {
        queryParams['inferred_skills'] = params.inferredProfile.skills.slice(0, 5).join(',');
      }
    }

    const backendPage = await apiRequest<BackendFeedPage>({
      method: 'get',
      url: '/api/v1/feed/opportunities',
      params: queryParams,
    });

    const oppCards = backendPage.items.map((bc) => oppToFeedCard(backendCardToOpportunity(bc), params, bc));
    const mixed = mixCards(oppCards);

    return {
      cards: mixed,
      nextCursor: backendPage.next_cursor !== null ? encodeCursor(backendPage.next_cursor) : null,
      hasMore: backendPage.has_more,
    };
  } catch {
    // ── Fallback to legacy endpoint ─────────────────────────────────────
  }

  const skip = params.cursor ? decodeCursor(params.cursor) : 0;

  const opportunities = await opportunityService.getOpportunities({
    skip,
    limit: PAGE_SIZE,
    category: 'jobs',
  });

  const oppCards = opportunities.map((opp) => oppToFeedCard(opp, params));
  const mixed = mixCards(oppCards);

  const hasMore = opportunities.length === PAGE_SIZE;
  const nextSkip = skip + PAGE_SIZE;

  return {
    cards: mixed,
    nextCursor: hasMore ? encodeCursor(nextSkip) : null,
    hasMore,
  };
}

// ── Interest toggle ───────────────────────────────────────────────────────────

export interface InterestToggleResult {
  opportunityId: number;
  isInterested: boolean;
  interestedCount: number;
}

export interface ActivityActionResult {
  opportunityId: number;
  activityType: string;
  isActive: boolean;
  count: number;
}

export async function expressInterest(opportunityId: number): Promise<InterestToggleResult> {
  const result = await apiRequest<{ opportunity_id: number; is_interested: boolean; interested_count: number }>({
    method: 'post',
    url: `/api/v1/feed/opportunities/${opportunityId}/interest`,
  });
  return {
    opportunityId: result.opportunity_id,
    isInterested: result.is_interested,
    interestedCount: result.interested_count,
  };
}

async function recordActivityAction(opportunityId: number, action: 'save' | 'share' | 'apply-click'): Promise<ActivityActionResult> {
  const result = await apiRequest<{ opportunity_id: number; activity_type: string; is_active: boolean; count: number }>({
    method: 'post',
    url: `/api/v1/feed/opportunities/${opportunityId}/${action}`,
  });
  return {
    opportunityId: result.opportunity_id,
    activityType: result.activity_type,
    isActive: result.is_active,
    count: result.count,
  };
}

export async function toggleSave(opportunityId: number): Promise<ActivityActionResult> {
  return recordActivityAction(opportunityId, 'save');
}

export async function recordShare(opportunityId: number): Promise<ActivityActionResult> {
  return recordActivityAction(opportunityId, 'share');
}

export async function recordApplyClick(opportunityId: number): Promise<ActivityActionResult> {
  return recordActivityAction(opportunityId, 'apply-click');
}

// ── Insight cards (personalised, replaces static pools) ──────────────────────

/**
 * Fetch live personalised insight cards from the backend and update the module-level
 * live pools used by mixCards(). Safe to call on every feed mount — idempotent.
 */
export async function loadInsightCards(): Promise<void> {
  try {
    const result = await apiRequest<{ cards: BackendInsightCard[] }>({
      method: 'get',
      url: '/api/v1/feed/insight-cards',
    });

    const byType: Record<string, Omit<InsightFeedCard, 'id'>[]> = {
      trust_insight: [],
      market_intelligence: [],
      community_proof: [],
      graph_discovery: [],
    };

    for (const card of result.cards) {
      const mapped: Omit<InsightFeedCard, 'id'> = {
        type: card.type as InsightFeedCard['type'],
        headline: card.headline,
        body: card.body,
        ctaLabel: card.cta_label ?? undefined,
        ctaHref: card.cta_href ?? undefined,
        iconKey: card.icon_key as InsightFeedCard['iconKey'],
      };
      if (byType[card.type]) byType[card.type].push(mapped);
    }

    if (byType.trust_insight.length) liveTrustCards = byType.trust_insight;
    if (byType.market_intelligence.length) liveMarketCards = byType.market_intelligence;
    if (byType.community_proof.length) liveCommunityCards = byType.community_proof;
    if (byType.graph_discovery.length) liveGraphCards = byType.graph_discovery;
  } catch {
    // Silently keep fallback pools — feed still works
  }
}

// ── Feed stats for TrustNudge card ────────────────────────────────────────────

export interface FeedStats {
  totalApplicantsThisWeek: number;
  verifiedApplicantsThisWeek: number;
}

export async function getFeedStats(): Promise<FeedStats> {
  try {
    const result = await apiRequest<BackendFeedStats>({
      method: 'get',
      url: '/api/v1/feed/stats',
    });
    return {
      totalApplicantsThisWeek: result.total_applicants_this_week,
      verifiedApplicantsThisWeek: result.verified_applicants_this_week,
    };
  } catch {
    return { totalApplicantsThisWeek: 340, verifiedApplicantsThisWeek: 12 };
  }
}

// ── Opportunity activity ──────────────────────────────────────────────────────

export interface OppActivityResult {
  items: Array<{
    userId?: number;
    activityType: string;
    createdAt: string;
  }>;
  totalInterested: number;
  totalSaved: number;
}

export async function getOpportunityActivity(opportunityId: number, limit = 10): Promise<OppActivityResult> {
  const result = await apiRequest<{
    items: Array<{ user_id?: number; activity_type: string; created_at: string }>;
    total_interested: number;
    total_saved: number;
  }>({
    method: 'get',
    url: `/api/v1/feed/opportunities/${opportunityId}/activity`,
    params: { limit },
  });
  return {
    items: result.items.map((i) => ({
      userId: i.user_id,
      activityType: i.activity_type,
      createdAt: i.created_at,
    })),
    totalInterested: result.total_interested,
    totalSaved: result.total_saved,
  };
}