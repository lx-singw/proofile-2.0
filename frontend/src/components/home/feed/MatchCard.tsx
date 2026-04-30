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
} from 'lucide-react';
import Link from 'next/link';
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
  onExpand,
  onNetworkPrompt,
}: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(card.viewerHasSaved);
  const [dismissed, setDismissed] = useState(false);
  const [interested, setInterested] = useState(card.viewerIsInterested);
  const [localInterestedCount, setLocalInterestedCount] = useState(card.interestedCount);
  const [localSavedCount, setLocalSavedCount] = useState(card.savedCount);

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

  if (dismissed) return null;

  const isTopApplicant =
    userFeedState === 'verified' &&
    card.matchContext.state === 'verified' &&
    card.matchContext.matchStrengthPercent >= 70;

  return (
    <article
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-emerald-200/40 dark:border-emerald-800/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      data-card-id={card.id}
      data-feed-position={feedPosition}
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
              {card.source === 'direct' && (
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
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              {saved ? (
                <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Bookmark className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Not for me"
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Location + remote + salary */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {card.location}
          </span>
          <RemoteBadge type={card.remoteType} />
          <span className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            {formatSalary(card.salaryMin, card.salaryMax, card.salaryCurrency, card.salaryVisible)}
          </span>
        </div>

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
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This is a great opportunity for professionals with your background. Apply directly or
              express interest to let this company know you&apos;re open.
            </p>
            <OppActivityFeed items={card.recentActivityItems ?? []} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleInterest}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] ${
              interested
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:shadow-md hover:shadow-emerald-500/25'
            }`}
            aria-pressed={interested}
          >
            {interested ? (
              <><HeartHandshake className="w-4 h-4" /> Interested</>
            ) : (
              <><Heart className="w-4 h-4" /> Express Interest</>
            )}
          </button>
          <button
            onClick={handleExpand}
            className="flex items-center gap-1.5 py-2.5 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            {expanded ? (
              <>Less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Tell me more <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
