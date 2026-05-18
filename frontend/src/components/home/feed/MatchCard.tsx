'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Building2,
  Clock,
  Users,
  TrendingUp,
  X,
  Wifi,
  WifiOff,
  Layers,
  Heart,
  HeartHandshake,
  ExternalLink,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  OpportunityFeedCard,
  AnonymousMatchContext,
  ProfileMatchContext,
  VerifiedMatchContext,
  UserFeedState,
  UserMiniCard,
  OppActivityItem,
} from '@/types/feedCard';

interface MatchCardProps {
  card: OpportunityFeedCard;
  userFeedState: UserFeedState;
  feedPosition: number;
  /** Live reviewer-connection count from graph API (overrides matchContext.reviewerConnections) */
  reviewerConnectionCount?: number;
  onView?: (cardId: string) => void;
  onDwell?: (cardId: string, seconds: number) => void;
  onExpand?: (cardId: string) => void;
  onInterest?: (card: OpportunityFeedCard) => void;
  /** Called after interest toggle; receives new state */
  onInterestToggle?: (opportunityId: number, isInterested: boolean) => Promise<void>;
  onDismiss?: (cardId: string) => void;
  onSave?: (card: OpportunityFeedCard) => void;
  onShare?: (card: OpportunityFeedCard) => void;
  onApplyClick?: (card: OpportunityFeedCard) => void;
  /** Called when a guest taps on network/social content requiring an account */
  onNetworkPrompt?: () => void;
}

// ── Salary formatting ─────────────────────────────────────────────────────────

function formatSalary(min?: number, max?: number, currency = 'ZAR', visible = true): string {
  if (!visible) return 'Competitive — enquire';
  if (!min) return 'Salary not listed';
  const fmt = (n: number) =>
    currency === 'ZAR' ? `R${(n / 1000).toFixed(0)}k` : `$${(n / 1000).toFixed(0)}k`;
  if (max && max !== min) return `${fmt(min)} – ${fmt(max)}/month`;
  return `${fmt(min)}/month`;
}

// ── Date formatting ───────────────────────────────────────────────────────────

function formatPostedDate(postedAt: string): string {
  const posted = new Date(postedAt);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ── Deadline formatting and urgency ───────────────────────────────────────────

type DeadlineState = {
  text: string;
  barColor: string;
  bgColor: string;
  textColor: string;
  progress: number; // 0-100 for progress bar
};

function getDeadlineState(closesAt?: string): DeadlineState {
  if (!closesAt) {
    return {
      text: 'Not listed',
      barColor: 'bg-gray-300 dark:bg-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-500 dark:text-gray-400',
      progress: 0,
    };
  }
  
  const deadline = new Date(closesAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Expired
  if (diffDays < 0) {
    return {
      text: 'Closed',
      barColor: 'bg-gray-400 dark:bg-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-500 dark:text-gray-400',
      progress: 100,
    };
  }
  
  // Today
  if (diffDays === 0) {
    return {
      text: 'Closes today',
      barColor: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-400',
      progress: 95,
    };
  }
  
  // Tomorrow
  if (diffDays === 1) {
    return {
      text: 'Tomorrow',
      barColor: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-400',
      progress: 90,
    };
  }
  
  // Urgent (2-3 days)
  if (diffDays <= 3) {
    return {
      text: `${diffDays} days left`,
      barColor: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-400',
      progress: 75,
    };
  }
  
  // Active (normal)
  if (diffDays <= 30) {
    return {
      text: `${diffDays} days left`,
      barColor: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      progress: Math.max(20, 100 - (diffDays * 2)),
    };
  }
  
  // Long runway
  return {
    text: `${diffDays} days left`,
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    progress: 20,
  };
}

// ── Source platform badge ─────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  careers24: 'Careers24',
  recentjobs: 'RecentJobs',
  studentroom: 'StudentRoom',
  zabursaries: 'ZaBursaries',
  puffandpass: 'PuffAndPass',
  dpsa: 'DPSA',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  pnet: 'PNet',
  offerzen: 'OfferZen',
};

function SourceBadge({ platform }: { platform: string }) {
  const label = SOURCE_LABELS[platform.toLowerCase()] ?? platform;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200/60 dark:border-gray-600/30">
      {label}
    </span>
  );
}

// ── Remote type badge ─────────────────────────────────────────────────────────

function RemoteBadge({ type }: { type: OpportunityFeedCard['remoteType'] }) {
  const config = {
    remote: { label: 'Remote', icon: Wifi, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    hybrid: { label: 'Hybrid', icon: Layers, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    flexible: { label: 'Flexible', icon: Layers, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    onsite: { label: 'On-site', icon: WifiOff, className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  };
  const { label, icon: Icon, className } = config[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ── Metadata row with deadline urgency ───────────────────────────────────────

function MetadataRow({ card }: { card: OpportunityFeedCard }) {
  const deadlineState = getDeadlineState(card.closesAt);
  const postedText = formatPostedDate(card.postedAt);
  
  // Type: use opportunityType if available, else fall back to remoteType
  const typeDisplay = card.opportunityType || (
    card.remoteType === 'remote' ? 'Remote' :
    card.remoteType === 'hybrid' ? 'Hybrid' :
    card.remoteType === 'flexible' ? 'Flexible' : 'On-site'
  );
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/40 dark:border-gray-700/30">
      {/* Location */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Location
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {card.location}
        </div>
      </div>
      
      {/* Type */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Type
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate capitalize">
          {typeDisplay}
        </div>
      </div>
      
      {/* Posted */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Posted
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {postedText}
        </div>
      </div>
      
      {/* Deadline with urgency bar */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Deadline
        </div>
        <div className={`text-sm font-semibold ${deadlineState.textColor} px-2 py-0.5 rounded ${deadlineState.bgColor}`}>
          {deadlineState.text}
        </div>
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${deadlineState.barColor} transition-all duration-300`}
            style={{ width: `${deadlineState.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Match strength bars ───────────────────────────────────────────────────────

function MatchStrengthBars({ percent, label }: { percent: number; label: string }) {
  const filled = Math.round((percent / 100) * 5);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm transition-all ${
              i < filled
                ? 'bg-emerald-500'
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ── "Why You're Seeing This" section ─────────────────────────────────────────

function WhyYouSeeThis({
  context,
}: {
  context: AnonymousMatchContext | ProfileMatchContext | VerifiedMatchContext;
}) {
  if (context.state === 'anonymous') {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/30 p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Why you&apos;re seeing this
        </p>
        <ul className="space-y-1">
          {context.behavioural.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="text-emerald-500 mt-0.5">~</span>
              {reason}
            </li>
          ))}
        </ul>
        <Link
          href="/login"
          className="mt-2 inline-block text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
        >
          Sign in to see your real match strength →
        </Link>
      </div>
    );
  }

  if (context.state === 'profile') {
    return (
      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/20 p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Why you&apos;re seeing this
        </p>
        <ul className="space-y-1.5">
          {context.matchedSkills.map((skill, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-medium">{skill}</span>
              <span className="text-amber-600 dark:text-amber-400 text-xs">(unverified)</span>
            </li>
          ))}
        </ul>
        <div className="mt-2.5 pt-2 border-t border-amber-200/40 dark:border-amber-700/20">
          <MatchStrengthBars percent={context.matchStrengthPercent} label="Potential" />
          <Link
            href="/profile#reviews"
            className="mt-1.5 inline-block text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
          >
            Get a verified review to unlock your real score →
          </Link>
        </div>
      </div>
    );
  }

  // verified
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-700/20 p-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Why you&apos;re seeing this
      </p>
      <ul className="space-y-1.5">
        {context.verifiedSkills.map((skill, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">{skill}</span>
            <span className="text-gray-400 dark:text-gray-500">— verified by your reviewers</span>
          </li>
        ))}
        {context.reviewerConnections > 0 && (
          <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            {context.reviewerConnections} of your reviewers worked here
          </li>
        )}
        {context.proofileScorePercentile > 0 && (
          <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            Your profile beats {context.proofileScorePercentile}% of past applicants
          </li>
        )}
      </ul>
      <div className="mt-2.5 pt-2 border-t border-emerald-200/40 dark:border-emerald-700/20">
        <MatchStrengthBars percent={context.matchStrengthPercent} label="Strong" />
      </div>
    </div>
  );
}

// ── Market context bar ────────────────────────────────────────────────────────

function MarketContextBar({ card, interestedCount }: { card: OpportunityFeedCard; interestedCount: number }) {
  const daysSince = card.postedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(card.postedAt).getTime()) / 86400000))
    : null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
      {card.avgSalaryForRole && card.salaryVisible && (
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-emerald-500" />
          SA avg: {formatSalary(card.avgSalaryForRole, undefined, card.salaryCurrency)}/mo
        </span>
      )}
      {interestedCount > 0 && (
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 text-teal-500" />
          {interestedCount} interested this week
        </span>
      )}
      {daysSince !== null && (
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Posted {daysSince === 0 ? 'today' : `${daysSince}d ago`}
        </span>
      )}
    </div>
  );
}

// ── Undervalue callout ────────────────────────────────────────────────────────

function UndervalueCallout({ insight }: { insight: string }) {
  return (
    <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-700/20 p-3 flex items-start gap-2">
      <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">{insight}</p>
    </div>
  );
}

// ── Social proof row ──────────────────────────────────────────────────────────

function SocialProofRow({
  interestedCount,
  savedCount,
  topInterestedUsers,
  connectionsInterested,
  userFeedState,
  onNetworkPrompt,
}: {
  interestedCount: number;
  savedCount: number;
  topInterestedUsers?: UserMiniCard[];
  connectionsInterested?: number;
  userFeedState: UserFeedState;
  onNetworkPrompt?: () => void;
}) {
  if (interestedCount === 0 && savedCount === 0) return null;

  const avatars = topInterestedUsers?.slice(0, 3) ?? [];
  const hasNetworkContext = userFeedState !== 'anonymous' && connectionsInterested && connectionsInterested > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Stacked avatar circles */}
      {avatars.length > 0 && (
        <button
          onClick={userFeedState === 'anonymous' ? onNetworkPrompt : undefined}
          className="flex -space-x-2 focus:outline-none"
          aria-label="View people interested"
          title={userFeedState === 'anonymous' ? `Sign in to see who's interested` : 'People interested'}
        >
          {avatars.map((u, i) => (
            <div
              key={u.userId}
              style={{ zIndex: avatars.length - i }}
              className="relative w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold overflow-hidden"
            >
              {u.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
              ) : (
                u.displayName?.charAt(0)?.toUpperCase() ?? '?'
              )}
            </div>
          ))}
        </button>
      )}

      {/* Count summary */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {interestedCount > 0 && (
          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{interestedCount}</span> interested
          </span>
        )}
        {interestedCount > 0 && savedCount > 0 && <span className="mx-1">·</span>}
        {savedCount > 0 && (
          <span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{savedCount}</span> saved
          </span>
        )}
      </span>

      {/* Network context (only for profile/verified) */}
      {hasNetworkContext && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200/40 dark:border-emerald-700/20">
          {connectionsInterested} in your network
        </span>
      )}
    </div>
  );
}

// ── Opportunity activity mini-feed ────────────────────────────────────────────

function OppActivityFeed({ items }: { items: OppActivityItem[] }) {
  if (items.length === 0) return null;

  const label = (type: string) => {
    if (type === 'interested') return 'expressed interest';
    if (type === 'saved') return 'saved this';
    if (type === 'applied') return 'applied';
    return type;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Recent activity
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              {item.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <span>
              <span className="font-medium">{item.displayName ?? 'Someone'}</span>{' '}
              {label(item.activityType)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main MatchCard ────────────────────────────────────────────────────────────

export function MatchCard({
  card,
  userFeedState,
  feedPosition,
  reviewerConnectionCount,
  onInterest,
  onInterestToggle,
  onDismiss,
  onSave,
  onShare,
  onApplyClick,
  onExpand,
  onNetworkPrompt,
}: MatchCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(card.viewerHasSaved);
  const [dismissed, setDismissed] = useState(false);
  const [interested, setInterested] = useState(card.viewerIsInterested);
  const [localInterestedCount, setLocalInterestedCount] = useState(card.interestedCount);
  const [localSavedCount, setLocalSavedCount] = useState(card.savedCount);
  const detailsHref = `/opportunities/${card.slug || card.id}`;

  const handleExpand = useCallback(() => {
    setExpanded((v) => !v);
    if (!expanded) onExpand?.(card.id);
  }, [expanded, card.id, onExpand]);

  const handleSave = useCallback(() => {
    const next = !saved;
    setSaved(next);
    setLocalSavedCount((c) => c + (next ? 1 : -1));
    onSave?.(card);
  }, [card, saved, onSave]);

  const handleShare = useCallback(async () => {
    onShare?.(card);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: card.roleTitle,
          text: `${card.roleTitle} at ${card.companyName}`,
          url: card.applyUrl ?? `${window.location.origin}${detailsHref}`,
        });
      } catch {
        // ignore cancelled share sheets
      }
    }
  }, [card, detailsHref, onShare]);

  const handleApplyClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    onApplyClick?.(card);
  }, [card, onApplyClick]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.(card.id);
  }, [card.id, onDismiss]);

  const handleInterest = useCallback(async () => {
    const next = !interested;
    // Optimistic update
    setInterested(next);
    setLocalInterestedCount((c) => c + (next ? 1 : -1));
    onInterest?.(card);
    try {
      await onInterestToggle?.(Number(card.id), next);
    } catch {
      // Revert on error
      setInterested(!next);
      setLocalInterestedCount((c) => c + (next ? -1 : 1));
    }
  }, [card, interested, onInterest, onInterestToggle]);

  const handleCardNavigate = useCallback(() => {
    router.push(detailsHref);
  }, [router, detailsHref]);

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, [role="button"]')) {
        return;
      }
      handleCardNavigate();
    },
    [handleCardNavigate],
  );

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, [role="button"]')) {
        return;
      }
      event.preventDefault();
      handleCardNavigate();
    },
    [handleCardNavigate],
  );

  if (dismissed) return null;

  const isTopApplicant =
    userFeedState === 'verified' &&
    card.matchContext.state === 'verified' &&
    card.matchContext.matchStrengthPercent >= 70;

  return (
    <article
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-emerald-200/40 dark:border-emerald-800/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      data-card-id={card.id}
      data-feed-position={feedPosition}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-5 space-y-4">
        {/* Header: logo + company + title + actions */}
        <div className="flex items-start gap-3">
          {/* Company logo placeholder */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center flex-shrink-0 border border-emerald-200/40 dark:border-emerald-700/30">
            {card.companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.companyLogoUrl} alt={card.companyName} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                {card.companyName}
              </span>
              {card.sourcePlatform && (
                <SourceBadge platform={card.sourcePlatform} />
              )}
              {card.source === 'direct' && !card.sourcePlatform && (
                <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                  Direct
                </span>
              )}
              {isTopApplicant && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-semibold flex items-center gap-1">
                  ⭐ Top Applicant
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mt-0.5">
              {card.roleTitle}
            </h3>
          </div>

          {/* Save + dismiss */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleSave}
              aria-label={saved ? 'Unsave' : 'Save opportunity'}
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-sm hover:shadow-emerald-500/10 transition-all"
            >
              {saved ? (
                <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Bookmark className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-emerald-600" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Not for me"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm transition-all"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share opportunity"
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-sm hover:shadow-emerald-500/10 transition-all"
            >
              <Share2 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Metadata row with deadline urgency */}
        <MetadataRow card={card} />
        
        {/* Salary highlight */}
        {card.salaryVisible && card.salaryMin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/60 dark:border-emerald-700/30">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {formatSalary(card.salaryMin, card.salaryMax, card.salaryCurrency, card.salaryVisible)}
            </span>
          </div>
        )}

        {/* Undervalue callout — shown before WhyYouSeeThis when flagged */}
        {card.isUndervalue && card.undervalueInsight && (
          <UndervalueCallout insight={card.undervalueInsight} />
        )}

        {/* Why You're Seeing This */}
        <WhyYouSeeThis
          context={
            reviewerConnectionCount !== undefined &&
            card.matchContext.state === 'verified'
              ? { ...card.matchContext, reviewerConnections: reviewerConnectionCount }
              : card.matchContext
          }
        />

        {/* Skill tags */}
        {card.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.requiredSkills.slice(0, expanded ? undefined : 4).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200/60 dark:border-gray-600/30"
              >
                {skill}
              </span>
            ))}
            {!expanded && card.requiredSkills.length > 4 && (
              <span className="px-2.5 py-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                +{card.requiredSkills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Market context */}
        <MarketContextBar card={card} interestedCount={localInterestedCount} />

        {/* Social proof row */}
        <SocialProofRow
          interestedCount={localInterestedCount}
          savedCount={localSavedCount}
          topInterestedUsers={card.topInterestedUsers}
          userFeedState={userFeedState}
          onNetworkPrompt={onNetworkPrompt}
        />

        {/* Expanded content */}
        {expanded && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400/50 scrollbar-track-gray-100 dark:scrollbar-thumb-emerald-600/50 dark:scrollbar-track-gray-800 pr-2">
            {card.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {card.description}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No description available for this listing.
              </p>
            )}
            <OppActivityFeed items={card.recentActivityItems ?? []} />
            
            {/* Apply Now button in expanded section */}
            {card.applyUrl && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <a
                  href={card.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleApplyClick}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all active:scale-[0.98]"
                >
                  Apply Now <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleExpand}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-500/25"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Close Preview</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> QUICK PREVIEW</>
            )}
          </button>
          <a
            href={detailsHref}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:shadow-md hover:shadow-emerald-500/25 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600"
          >
            <ExternalLink className="w-4 h-4" /> FULL DETAILS
          </a>
        </div>
      </div>
    </article>
  );
}
