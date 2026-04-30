'use client';

import {
  BarChart2,
  Network,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { InsightFeedCard } from '@/types/feedCard';

interface InsightCardProps {
  card: InsightFeedCard;
}

const ICON_MAP = {
  chart: BarChart2,
  network: Network,
  market: TrendingUp,
  community: Users,
  star: Star,
};

const TYPE_STYLES: Record<InsightFeedCard['type'], { accent: string; bg: string; border: string; tag: string }> = {
  trust_insight: {
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200/50 dark:border-emerald-700/20',
    tag: 'Insight',
  },
  graph_discovery: {
    accent: 'from-purple-500 via-violet-500 to-indigo-500',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    border: 'border-purple-200/50 dark:border-purple-700/20',
    tag: 'Your Network',
  },
  market_intelligence: {
    accent: 'from-blue-500 via-cyan-500 to-teal-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200/50 dark:border-blue-700/20',
    tag: 'Market',
  },
  community_proof: {
    accent: 'from-amber-500 via-orange-500 to-red-400',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200/50 dark:border-amber-700/20',
    tag: 'Community',
  },
};

export function InsightCard({ card }: InsightCardProps) {
  const styles = TYPE_STYLES[card.type];
  const Icon = ICON_MAP[card.iconKey];

  return (
    <article
      className={`rounded-2xl border ${styles.border} ${styles.bg} overflow-hidden`}
      data-card-id={card.id}
    >
      {/* Thin accent bar */}
      <div className={`h-1 bg-gradient-to-r ${styles.accent}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${styles.accent} flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {styles.tag}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              {card.headline}
            </h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {card.body}
            </p>

            {card.ctaLabel && (
              <div className="mt-2.5">
                {card.ctaHref ? (
                  <Link
                    href={card.ctaHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {card.ctaLabel}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    {card.ctaLabel}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
