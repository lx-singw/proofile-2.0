// ─────────────────────────────────────────────────────────────────────────────
// Feed Card Types — Proofile Opportunity Feed
// ─────────────────────────────────────────────────────────────────────────────

export type UserFeedState = 'anonymous' | 'profile' | 'verified';

export type FeedCardType =
  | 'opportunity'
  | 'trust_insight'
  | 'graph_discovery'
  | 'market_intelligence'
  | 'community_proof'
  | 'learning_trigger'
  | 'trust_nudge'
  | 'score_upgrade';

// ── Social proof types ────────────────────────────────────────────────────────

export interface UserMiniCard {
  userId: number;
  displayName: string;
  avatarUrl?: string;
  headline?: string;
}

export interface OppActivityItem {
  userId?: number;
  displayName?: string;
  avatarUrl?: string;
  activityType: 'interested' | 'saved' | 'applied' | 'shared';
  createdAt: string;
}

// ── Opportunity card ──────────────────────────────────────────────────────────

export interface OpportunityFeedCard {
  type: 'opportunity';
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  roleTitle: string;
  location: string;
  remoteType: 'onsite' | 'hybrid' | 'remote' | 'flexible';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryVisible: boolean;
  requiredSkills: string[];
  postedAt: string;
  closesAt?: string;
  source: 'aggregated' | 'direct';
  qualityScore: number;
  engagementRate: number;
  // Match context — varies by UserFeedState
  matchContext: AnonymousMatchContext | ProfileMatchContext | VerifiedMatchContext;
  // Market context
  avgSalaryForRole?: number;
  // Social proof (real data from backend)
  interestedCount: number;
  savedCount: number;
  viewerIsInterested: boolean;
  viewerHasSaved: boolean;
  topInterestedUsers?: UserMiniCard[];
  recentActivityItems?: OppActivityItem[];
  // Flags
  isUndervalue?: boolean;
  undervalueInsight?: string;
}

export interface AnonymousMatchContext {
  state: 'anonymous';
  behavioural: string[]; // e.g. ["Matches your apparent interest in backend roles"]
}

export interface ProfileMatchContext {
  state: 'profile';
  matchedSkills: string[];    // stated skills that overlap
  unmatchedSkills: string[];  // required skills not on profile
  matchStrengthPercent: number; // 0–100, potential only
}

export interface VerifiedMatchContext {
  state: 'verified';
  verifiedSkills: string[];             // confirmed by reviewers
  reviewerConnections: number;          // # reviewers who worked at this company
  matchStrengthPercent: number;         // 0–100, graph-based
  proofileScorePercentile: number;      // vs typical applicants (0–100)
}

// ── Non-opportunity cards ─────────────────────────────────────────────────────

export interface InsightFeedCard {
  type: 'trust_insight' | 'graph_discovery' | 'market_intelligence' | 'community_proof';
  id: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  iconKey: 'chart' | 'network' | 'market' | 'community' | 'star';
}

export interface LearningTriggerCard {
  type: 'learning_trigger';
  id: string;
  inferredRole: string;
  inferredLocation: string;
  inferredSalaryMin: number;
  inferredSalaryMax: number;
  salaryCurrency: string;
}

export interface TrustNudgeCard {
  type: 'trust_nudge';
  id: string;
  totalApplicants: number;
  verifiedApplicants: number;
}

export interface ScoreUpgradeCard {
  type: 'score_upgrade';
  id: string;
  currentScore: number;
  reviewsNeeded: number;
  targetScore: number;
}

export type FeedCard =
  | OpportunityFeedCard
  | InsightFeedCard
  | LearningTriggerCard
  | TrustNudgeCard
  | ScoreUpgradeCard;

// ── Signal tracking ──────────────────────────────────────────────────────────

export type SignalType =
  | 'view'
  | 'dwell_3s'
  | 'dwell_10s'
  | 'expand'
  | 'interest'
  | 'dismiss'
  | 'save'
  | 'share'
  | 'scroll_past';

export interface SignalEvent {
  cardId: string;
  userId: string | null;       // null for anonymous
  sessionId: string;
  signalType: SignalType;
  timestamp: number;
  feedPosition: number;
  cardType: FeedCardType;
  sessionDurationAtSignal: number;
}

// ── Session inference ─────────────────────────────────────────────────────────

export interface InferredProfile {
  role: string;
  industry: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  skills: string[];
  confirmedByUser: boolean;
}

// ── Feed pagination ───────────────────────────────────────────────────────────

export interface FeedPage {
  cards: FeedCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedPageParams {
  cursor?: string;
  inferredProfile?: InferredProfile;
  userFeedState: UserFeedState;
  sidebarFilters?: {
    location?: string;
    industry?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills?: string[];
  };
}
