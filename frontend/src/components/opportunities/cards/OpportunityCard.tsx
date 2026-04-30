"use client";

import type { OpportunityRecommendation } from "@/services/opportunityService";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    BarChart2,
    BookOpen,
    Briefcase,
    Calendar,
    Car,
    CheckCircle2,
    Clock,
    DollarSign,
    Globe,
    GraduationCap,
    Heart,
    MapPin,
    Shield,
    Sparkles,
    Wifi,
    Zap
} from "lucide-react";
import Link from "next/link";

// ── Match Ring (SVG arc) ──────────────────────────────────────────────────────

function MatchRing({ score }: { score: number }) {
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(score, 100) / 100) * circumference;

  const color =
    score >= 80
      ? "#16a34a" // green-600
      : score >= 50
        ? "#059669" // emerald-600
        : "#9ca3af"; // gray-400

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-700"
        />
        {/* Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  );
}

// ── Benefit icon map ──────────────────────────────────────────────────────────

function benefitIcon(benefit: string) {
  const lower = benefit.toLowerCase();
  if (lower.includes("medical") || lower.includes("health"))
    return <Heart className="w-3 h-3" />;
  if (
    lower.includes("pension") ||
    lower.includes("provident") ||
    lower.includes("retirement")
  )
    return <Shield className="w-3 h-3" />;
  if (lower.includes("transport") || lower.includes("travel"))
    return <Car className="w-3 h-3" />;
  if (
    lower.includes("train") ||
    lower.includes("study") ||
    lower.includes("mentor")
  )
    return <BookOpen className="w-3 h-3" />;
  if (lower.includes("remote") || lower.includes("work from home"))
    return <Wifi className="w-3 h-3" />;
  return <Sparkles className="w-3 h-3" />;
}

// ── Days until deadline ───────────────────────────────────────────────────────

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface OpportunityCardProps {
  rec: OpportunityRecommendation;
  index: number;
  onQuickApply: (
    id: number,
    title: string,
    company: string,
    score: number,
  ) => void;
  onAuthGate?: () => void;
  isAuthenticated?: boolean;
}

export function OpportunityCard({
  rec,
  index,
  onQuickApply,
  onAuthGate,
  isAuthenticated = true,
}: OpportunityCardProps) {
  const { opportunity: opp, match_score, score_breakdown } = rec;

  const isTraining = opp.category === "training_skills_programs";
  const accentColor = isTraining ? "bg-purple-500" : "bg-emerald-500";

  // Deadline urgency
  const deadlineDays = daysUntil(
    opp.application_deadline_date ?? opp.expires_at,
  );
  const isUrgent =
    deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0;
  const isExpired = deadlineDays !== null && deadlineDays < 0;

  // Scam warning
  const showScamWarn = (opp.scam_score ?? 0) >= 0.6;

  // Salary display
  const salaryDisplay = (() => {
    if (opp.salary_min && opp.salary_max)
      return `R${Math.round(opp.salary_min / 1000)}k–R${Math.round(opp.salary_max / 1000)}k/mo`;
    if (opp.salary_min) return `From R${Math.round(opp.salary_min / 1000)}k/mo`;
    if (opp.salary_max)
      return `Up to R${Math.round(opp.salary_max / 1000)}k/mo`;
    return opp.salary_range ?? null;
  })();

  const matchBreakdownItems = [
    score_breakdown.title_match > 0 && "Role matches your goal",
    score_breakdown.skills_match > 0 && "Skills overlap found",
    score_breakdown.industry_match > 0 && "Industry match",
    score_breakdown.experience_match > 0 && "Experience level aligns",
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="relative"
    >
      {/* Outer link wrapper — entire card is clickable */}
      <Link
        href={`/opportunities/${opp.id}?score=${match_score}`}
        className="block relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-emerald-500/8 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 overflow-hidden group"
      >
        {/* Left accent bar */}
        <span
          className={`absolute left-0 inset-y-0 w-1 ${accentColor} rounded-l-2xl`}
        />

        <div className="pl-5 pr-5 pt-5 pb-4">
          {/* ── Row 1: company + match ring + save ── */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {/* Company avatar fallback */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${isTraining ? "bg-gradient-to-br from-purple-500 to-violet-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"}`}
              >
                {opp.company_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {opp.company_name}
                </p>
                {opp.location && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {opp.location}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MatchRing score={match_score} />
            </div>
          </div>

          {/* ── Row 2: Title ── */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug mb-3">
            {opp.title}
          </h2>

          {/* ── Row 3: Meta chips ── */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {isTraining ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                <GraduationCap className="w-3 h-3" /> Training
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <Briefcase className="w-3 h-3" /> Job
              </span>
            )}
            {opp.opportunity_type && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                <Clock className="w-3 h-3" /> {opp.opportunity_type}
              </span>
            )}
            {opp.remote_type && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  opp.remote_type === "remote"
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : opp.remote_type === "hybrid"
                      ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {opp.remote_type.charAt(0).toUpperCase() +
                  opp.remote_type.slice(1)}
              </span>
            )}
            {opp.experience_level && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium capitalize">
                {opp.experience_level}
              </span>
            )}
            {salaryDisplay && opp.salary_visible !== false && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium">
                <DollarSign className="w-3 h-3" /> {salaryDisplay}
              </span>
            )}
            {opp.duration && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-medium">
                {opp.duration}
              </span>
            )}
          </div>

          {/* ── Row 4: Benefits preview ── */}
          {opp.benefits && opp.benefits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {opp.benefits.slice(0, 3).map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs border border-teal-100 dark:border-teal-800"
                >
                  {benefitIcon(b)} {b}
                </span>
              ))}
              {opp.benefits.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs border border-gray-200 dark:border-gray-600">
                  +{opp.benefits.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* ── Row 5: Match breakdown ── */}
          {matchBreakdownItems.length > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 dark:from-gray-700/30 dark:to-emerald-900/10 rounded-xl px-4 py-3 mb-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Why
                you&apos;re a match
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {matchBreakdownItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {item}
                  </div>
                ))}
              </div>
              {/* Score bar */}
              <div className="mt-2.5 h-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(match_score, 100)}%` }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05 + 0.2,
                    ease: "easeOut",
                  }}
                  className={`h-full rounded-full ${match_score >= 80 ? "bg-green-500" : match_score >= 50 ? "bg-emerald-500" : "bg-gray-400"}`}
                />
              </div>
            </div>
          )}

          {/* ── Tags cloud ── */}
          {opp.tags && opp.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {opp.tags.slice(0, 5).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: actions + warnings ── */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3">
          {/* Urgency / expiry banners */}
          {isExpired ? (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2">
              ⚠ This listing has expired
            </p>
          ) : isUrgent && deadlineDays !== null ? (
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Closes in{" "}
                {deadlineDays === 0
                  ? "today"
                  : `${deadlineDays} day${deadlineDays > 1 ? "s" : ""}`}
              </span>
            </div>
          ) : null}

          {/* Scam warning */}
          {showScamWarn && (
            <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {opp.red_flags?.[0] ??
                  "This listing has unusual characteristics. Review carefully before applying."}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {/* Quick Apply — stops propagation so card link doesn't fire */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isAuthenticated) {
                    onAuthGate?.();
                    return;
                  }
                  onQuickApply(
                    opp.id,
                    opp.title,
                    opp.company_name,
                    match_score,
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
              >
                <Zap className="w-3.5 h-3.5" /> Quick Apply
              </button>

              {/* Gap Analysis */}
              <Link
                href={`/opportunities/${opp.id}/gap-analysis`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    e.preventDefault();
                    onAuthGate?.();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" /> Gap Analysis
              </Link>
            </div>

            {/* Direct badge */}
            {opp.is_direct && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <Globe className="w-3.5 h-3.5" /> Direct
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
