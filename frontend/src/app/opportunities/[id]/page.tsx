"use client";

import { jobService, type JobDetail } from "@/services/opportunityService";
import type {
  QualificationRequirements,
  ExperienceRequirements,
  StructuredSkill,
  KnowledgeRequirements,
} from "@/services/opportunityService";
import { motion } from "framer-motion";
import { ShareModal } from "@/components/opportunities/ShareModal";
import { ApplicationMethodCard } from "@/components/opportunities/ApplicationMethodCard";
import { ContactSection } from "@/components/opportunities/ContactSection";
import { EligibilityBadges } from "@/components/opportunities/EligibilityBadges";
import { RequiredDocuments } from "@/components/opportunities/RequiredDocuments";
import { SafetyTips } from "@/components/opportunities/SafetyTips";
import { SocialProof } from "@/components/opportunities/SocialProof";
import { VouchSection } from "@/components/opportunities/VouchSection";
import { QuickActions } from "@/components/opportunities/QuickActions";
import { MobileCTA } from "@/components/opportunities/MobileCTA";
import { timeAgo } from "@/lib/helpers";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Info,
  Mail,
  MapPin,
  Phone,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";

function formatSalary(
  min?: number | null,
  max?: number | null,
  range?: string | null,
): string | null {
  if (min && max)
    return `R${(min / 1000).toFixed(0)}k – R${(max / 1000).toFixed(0)}k / month`;
  if (min) return `From R${(min / 1000).toFixed(0)}k / month`;
  if (max) return `Up to R${(max / 1000).toFixed(0)}k / month`;
  return range ?? null;
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function RemoteBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const map: Record<string, { label: string; color: string }> = {
    remote: { label: "Remote", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    hybrid: { label: "Hybrid", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    onsite: { label: "On-site", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
    flexible: { label: "Flexible", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
  };
  const cfg = map[type] ?? { label: type, color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function benefitIcon(benefit: string) {
  const l = benefit.toLowerCase();
  if (l.includes("medical") || l.includes("health")) return <Heart className="w-4 h-4" />;
  if (l.includes("pension") || l.includes("provident") || l.includes("retirement")) return <Shield className="w-4 h-4" />;
  if (l.includes("transport") || l.includes("travel")) return <Car className="w-4 h-4" />;
  if (l.includes("train") || l.includes("study") || l.includes("bursary")) return <BookOpen className="w-4 h-4" />;
  if (l.includes("remote") || l.includes("work from home")) return <Wifi className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}

function QuickOverviewCard({
  opp,
  deadline,
  deadlineDays,
  salary,
  startDate,
}: {
  opp: JobDetail["opportunity"];
  deadline: string | null;
  deadlineDays: number | null;
  salary: string | null;
  startDate: string | null;
}) {
  const facts = [
    opp.opportunity_type && { icon: <Briefcase className="w-4 h-4" />, label: "Type", value: opp.opportunity_type, color: "text-gray-700 dark:text-gray-300" },
    opp.experience_level && { icon: <Award className="w-4 h-4" />, label: "Level", value: opp.experience_level, color: "text-amber-600 dark:text-amber-400" },
    opp.duration && { icon: <Clock className="w-4 h-4" />, label: "Duration", value: opp.duration, color: "text-teal-600 dark:text-teal-400" },
    opp.remote_type && { icon: <Globe className="w-4 h-4" />, label: "Work Mode", value: opp.remote_type, color: "text-blue-600 dark:text-blue-400" },
    salary && opp.salary_visible !== false && { icon: <DollarSign className="w-4 h-4" />, label: "Salary", value: salary, color: "text-emerald-600 dark:text-emerald-400" },
    startDate && { icon: <Calendar className="w-4 h-4" />, label: "Start Date", value: startDate, color: "text-purple-600 dark:text-purple-400" },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; color: string }[];

  if (facts.length === 0 && !deadline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">At a Glance</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {facts.map((fact, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className={`${fact.color} mt-0.5`}>{fact.icon}</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">{fact.label}</p>
              <p className={`text-sm font-semibold capitalize ${fact.color}`}>{fact.value}</p>
            </div>
          </div>
        ))}
      </div>
      {deadline && deadlineDays !== null && (
        <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 ${
          deadlineDays <= 3 ? "text-red-600 dark:text-red-400" : deadlineDays <= 7 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"
        }`}>
          <Calendar className="w-4 h-4" />
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-70 font-medium">Application Deadline</p>
            <p className="text-sm font-semibold">
              {deadline}
              {deadlineDays >= 0 && (
                <span className="ml-2 text-xs font-normal opacity-80">
                  ({deadlineDays === 0 ? "Today!" : `${deadlineDays} day${deadlineDays > 1 ? "s" : ""} left`})
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RequirementsSummaryCard({
  opp,
}: {
  opp: JobDetail["opportunity"];
}) {
  const hasQualifications = opp.qualification_requirements?.minimum || opp.qualification_requirements?.ideal;
  const hasExperience = opp.experience_requirements?.minimum || opp.experience_requirements?.ideal;
  const hasSkills = (opp.skills_structured && opp.skills_structured.length > 0) || (opp.required_skills && opp.required_skills.length > 0);
  const hasKnowledge = opp.knowledge_requirements?.minimum?.length || opp.knowledge_requirements?.ideal?.length;
  const hasConditions = opp.conditions_of_employment && opp.conditions_of_employment.length > 0;
  const hasDocs = opp.required_documents && opp.required_documents.length > 0;

  const summaryItems = [
    hasQualifications && {
      icon: <GraduationCap className="w-4 h-4" />,
      label: "Qualifications",
      summary: opp.qualification_requirements?.minimum?.degree_level || "See details",
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    hasExperience && {
      icon: <Briefcase className="w-4 h-4" />,
      label: "Experience",
      summary: opp.experience_requirements?.minimum?.years_min
        ? `${opp.experience_requirements.minimum.years_min}+ years`
        : opp.experience_level || "See details",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    hasSkills && {
      icon: <Star className="w-4 h-4" />,
      label: "Skills",
      summary: `${(opp.skills_structured?.filter(s => s.level === "required").length || opp.required_skills?.length || 0)} required`,
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    hasKnowledge && {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Knowledge",
      summary: `${opp.knowledge_requirements?.minimum?.length || 0} areas`,
      color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    hasConditions && {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: "Conditions",
      summary: `${opp.conditions_of_employment?.length} items`,
      color: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    },
    hasDocs && {
      icon: <FileText className="w-4 h-4" />,
      label: "Documents",
      summary: `${opp.required_documents?.length} required`,
      color: "bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; summary: string; color: string }[];

  if (summaryItems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Requirements Overview</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {summaryItems.map((item, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${item.color}`}>
            {item.icon}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium">{item.label}</p>
              <p className="text-xs font-semibold truncate">{item.summary}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">Scroll down for detailed requirements in each section.</p>
    </motion.div>
  );
}

function SectionCard({ title, icon, children, className = "" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-emerald-500">{icon}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function MatchBanner({ oppId }: { oppId: number }) {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") ?? "0", 10);
  if (!score || score <= 0) return null;

  const isHigh = score >= 80;
  const isMid = score >= 50;
  const colorBg = isHigh
    ? "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/10 dark:border-green-700"
    : isMid
      ? "from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/10 dark:border-emerald-700"
      : "from-gray-50 to-gray-50 border-gray-200 dark:from-gray-700/30 dark:to-gray-700/30 dark:border-gray-600";
  const textColor = isHigh ? "text-green-700 dark:text-green-400" : isMid ? "text-emerald-700 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${colorBg} border rounded-2xl px-5 py-4 flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-3xl font-black tabular-nums ${textColor}`}>{score}%</div>
        <div>
          <p className={`font-semibold text-sm ${textColor}`}>AI Match Score</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Based on your skills, experience &amp; goals</p>
        </div>
      </div>
      <Link
        href={`/opportunities/${oppId}/gap-analysis`}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Zap className="w-3.5 h-3.5" /> Gap Analysis
      </Link>
    </motion.div>
  );
}

function QualificationsSection({ reqs }: { reqs?: QualificationRequirements | null }) {
  if (!reqs || (!reqs.minimum && !reqs.ideal)) return null;

  const renderLevel = (level: typeof reqs.minimum, label: string, colorClass: string) => {
    if (!level) return null;
    const fields = [
      level.degree_level,
      level.field_of_study?.join(", "),
      level.min_percentage != null ? `Min: ${level.min_percentage}%` : null,
      level.certifications?.join(", "),
    ].filter(Boolean) as string[];
    if (!fields.length && !level.specific_subjects?.length) return null;

    return (
      <div className={`flex-1 rounded-xl p-4 border ${colorClass}`}>
        <p className="text-xs font-bold uppercase tracking-wide mb-3 opacity-60">{label}</p>
        {fields.map((f, i) => (
          <div key={i} className="flex items-start gap-2 mb-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
        {level.specific_subjects && level.specific_subjects.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Subjects:</p>
            <div className="flex flex-wrap gap-1">
              {level.specific_subjects.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <SectionCard title="Qualifications" icon={<GraduationCap className="w-5 h-5" />}>
      <div className="flex gap-4 flex-col sm:flex-row">
        {renderLevel(reqs.minimum, "Minimum required", "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 text-gray-800 dark:text-gray-200")}
        {renderLevel(reqs.ideal, "Ideal / preferred", "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 text-gray-800 dark:text-gray-200")}
      </div>
    </SectionCard>
  );
}

function ExperienceSection({ reqs }: { reqs?: ExperienceRequirements | null }) {
  if (!reqs || (!reqs.minimum && !reqs.ideal)) return null;

  const yearsLabel = (lvl: typeof reqs.minimum) => {
    if (!lvl) return null;
    if (lvl.years_min && lvl.years_max) return `${lvl.years_min}–${lvl.years_max} years`;
    if (lvl.years_min) return `${lvl.years_min}+ years`;
    if (lvl.years_max) return `Up to ${lvl.years_max} years`;
    return null;
  };

  return (
    <SectionCard title="Experience Requirements" icon={<Briefcase className="w-5 h-5" />}>
      <div className="flex gap-4 flex-col sm:flex-row">
        {reqs.minimum && (
          <div className="flex-1 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Minimum</p>
            {yearsLabel(reqs.minimum) && (
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{yearsLabel(reqs.minimum)}</p>
            )}
            {reqs.minimum.description && <p className="text-sm text-gray-600 dark:text-gray-400">{reqs.minimum.description}</p>}
          </div>
        )}
        {reqs.ideal && (
          <div className="flex-1 rounded-xl p-4 border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-2">Ideal</p>
            {yearsLabel(reqs.ideal) && (
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-1">{yearsLabel(reqs.ideal)}</p>
            )}
            {reqs.ideal.description && <p className="text-sm text-gray-600 dark:text-gray-400">{reqs.ideal.description}</p>}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function StructuredSkillsSection({
  skills,
  knowledge,
}: {
  skills?: StructuredSkill[] | null;
  knowledge?: KnowledgeRequirements | null;
}) {
  const required = skills?.filter((s) => s.level === "required") ?? [];
  const preferred = skills?.filter((s) => s.level !== "required") ?? [];
  const hasContent = required.length > 0 || preferred.length > 0 || (knowledge?.minimum?.length ?? 0) > 0 || (knowledge?.ideal?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <SectionCard title="Skills & Knowledge" icon={<Star className="w-5 h-5" />}>
      <div className="space-y-5">
        {required.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Required skills</p>
            <div className="flex flex-wrap gap-2">
              {required.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {preferred.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Preferred / nice to have</p>
            <div className="flex flex-wrap gap-2">
              {preferred.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {knowledge?.minimum && knowledge.minimum.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Knowledge required</p>
            <ul className="space-y-1.5">
              {knowledge.minimum.map((k, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {k}
                </li>
              ))}
            </ul>
          </div>
        )}
        {knowledge?.ideal && knowledge.ideal.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Knowledge — ideal</p>
            <ul className="space-y-1.5">
              {knowledge.ideal.map((k, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> {k}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function JobDetailsContent({ id }: { id: string }) {
  const router = useRouter();
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await jobService.getJobDetails(parseInt(id));
        setJobDetail(data);
      } catch (err) {
        console.error("Failed to fetch job:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSaveJob = async () => {
    if (!jobDetail) return;
    setSaving(true);
    try {
      if (jobDetail.is_saved) {
        await jobService.unsaveJob(jobDetail.opportunity.id);
        setJobDetail({ ...jobDetail, is_saved: false });
      } else {
        await jobService.saveJob(jobDetail.opportunity.id);
        setJobDetail({ ...jobDetail, is_saved: true });
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-48 bg-gray-100 dark:bg-gray-700/50 rounded-2xl mt-6" />
          <div className="h-32 bg-gray-100 dark:bg-gray-700/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Opportunity not found</p>
          <button onClick={() => router.back()} className="text-emerald-600 hover:text-emerald-700 font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { opportunity: opp, is_saved, related_opportunities } = jobDetail;
  const salary = formatSalary(opp.salary_min, opp.salary_max, opp.salary_range);
  const deadline = formatDate(opp.application_deadline_date ?? opp.expires_at);
  const startDate = formatDate(opp.start_date);
  const postedDate = formatDate(opp.posted_at ?? opp.created_at);
  const descLong = opp.description && opp.description.length > 600;
  const deadlineDays = daysUntil(opp.application_deadline_date ?? opp.expires_at);
  const scamRisk = (opp.scam_score ?? 0) >= 0.6;
  const isTraining = opp.category === "training_skills_programs";
  const applyUrl = opp.application_url ?? opp.contact_website ?? opp.source_url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="mb-2">
            <Breadcrumbs />
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Back to Opportunities</span>
              <span className="text-sm font-medium sm:hidden">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-500 transition-colors"
                title="Share opportunity"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveJob}
                disabled={saving}
                title={is_saved ? "Remove from saved" : "Save opportunity"}
                className={`p-2 rounded-lg border transition-colors ${
                  is_saved
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-500"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${is_saved ? "fill-current" : ""}`} />
              </button>
              {applyUrl ? (
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm shadow-emerald-600/20"
                >
                  Apply Now <ExternalLink className="w-4 h-4" />
                </a>
              ) : opp.contact_email ? (
                <a
                  href={`mailto:${opp.contact_email}?subject=Application: ${encodeURIComponent(opp.title)}`}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                >
                  Apply via Email <Mail className="w-4 h-4" />
                </a>
              ) : (
                <span className="inline-flex items-center px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                  Apply Now
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${
              isTraining
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            }`}>
              {isTraining
                ? <><GraduationCap className="w-3 h-3" /> Training &amp; Skills</>
                : <><Briefcase className="w-3 h-3" /> Job</>}
            </span>
            <RemoteBadge type={opp.remote_type} />
            {opp.experience_level && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium capitalize">
                {opp.experience_level}
              </span>
            )}
            {opp.verified_candidates_only && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" /> Verified Only
              </span>
            )}
            {opp.is_direct && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" /> Direct Listing
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {opp.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
              <Building2 className="w-4 h-4" /> {opp.company_name}
            </span>
            {opp.location && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {opp.location}</span>
            )}
            {opp.opportunity_type && (
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {opp.opportunity_type}</span>
            )}
            {opp.duration && (
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                <Calendar className="w-4 h-4" /> {opp.duration}
              </span>
            )}
            {salary && opp.salary_visible !== false && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <DollarSign className="w-4 h-4" /> {salary}
              </span>
            )}
            {postedDate && (
              <span className="flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" /> Posted {postedDate}
              </span>
            )}
          </div>

          {deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 14 && (
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
              deadlineDays <= 3
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              <Calendar className="w-4 h-4" />
              {deadlineDays === 0 ? "Closes today" : `Closes in ${deadlineDays} day${deadlineDays > 1 ? "s" : ""}`}
            </div>
          )}

          <SocialProof 
            views={opp.views || opp.views_count} 
            saves={opp.saves} 
            vouches={opp.vouches || (opp.vouch_positive ? opp.vouch_positive : undefined)} 
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Match Banner */}
            <MatchBanner oppId={opp.id} />

            {/* Quick Overview - At a Glance */}
            <QuickOverviewCard
              opp={opp}
              deadline={deadline}
              deadlineDays={deadlineDays}
              salary={salary}
              startDate={startDate}
            />

            {/* Requirements Summary */}
            <RequirementsSummaryCard opp={opp} />

            {/* Eligibility Badges */}
            {(opp.extra_metadata?.spider_eligibility || opp.extra_metadata?.education_level || opp.extra_metadata?.experience_years) && (
              <SectionCard title="Eligibility Criteria" icon={<Users className="w-5 h-5" />}>
                <EligibilityBadges 
                  eligibility={opp.extra_metadata?.spider_eligibility} 
                  education_level={opp.extra_metadata?.education_level}
                  experience_years={opp.extra_metadata?.experience_years}
                />
              </SectionCard>
            )}

            {/* Scam Alert */}
            {scamRisk && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">Caution: Unusual listing detected</h3>
                  <span className="ml-auto text-xs text-red-500 font-medium">{Math.round((opp.scam_score ?? 0) * 100)}% risk score</span>
                </div>
                {opp.red_flags && opp.red_flags.length > 0 ? (
                  <ul className="space-y-1 pl-2">
                    {opp.red_flags.map((flag, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                        <span className="mt-0.5">•</span>{flag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-red-600 dark:text-red-400">Review this listing carefully before providing personal information or paying any fees.</p>
                )}
              </motion.div>
            )}

            {/* Role Description */}
            <SectionCard title="Role Description" icon={<FileText className="w-5 h-5" />}>
              {/* Tags inline at top of description */}
              {opp.tags && opp.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  {opp.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className={`prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed overflow-hidden transition-all duration-300 ${!descExpanded && descLong ? "max-h-64" : ""}`}>
                {opp.description}
              </div>
              {descLong && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 text-sm font-medium"
                >
                  {descExpanded
                    ? <><ChevronUp className="w-4 h-4" /> Show less</>
                    : <><ChevronDown className="w-4 h-4" /> Read full description</>}
                </button>
              )}
            </SectionCard>

            {/* === REQUIREMENTS SECTION GROUP === */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Requirements & Qualifications
              </h2>

              {/* Qualifications */}
              <QualificationsSection reqs={opp.qualification_requirements} />

              {/* Experience Requirements */}
              <ExperienceSection reqs={opp.experience_requirements} />

              {/* Structured Skills & Knowledge */}
              <StructuredSkillsSection skills={opp.skills_structured} knowledge={opp.knowledge_requirements} />

              {/* Required Skills (flat, only if no structured skills) */}
              {opp.required_skills && opp.required_skills.length > 0 && !(opp.skills_structured && opp.skills_structured.length > 0) && (
                <SectionCard title="Required Skills" icon={<Award className="w-5 h-5" />}>
                  <div className="flex flex-wrap gap-2">
                    {opp.required_skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Conditions of Employment */}
              {opp.conditions_of_employment && opp.conditions_of_employment.length > 0 && (
                <SectionCard title="Conditions of Employment" icon={<ShieldCheck className="w-5 h-5" />}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">You must meet these conditions to be considered:</p>
                  <ul className="space-y-2">
                    {opp.conditions_of_employment.map((c, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </div>

            {/* Benefits Grid */}
            {opp.benefits && opp.benefits.length > 0 && (
              <SectionCard title="Benefits & Perks" icon={<Heart className="w-5 h-5" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {opp.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/50 rounded-xl">
                      <span className="text-teal-500 shrink-0">{benefitIcon(benefit)}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* === APPLICATION SECTION GROUP === */}
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                How to Apply
              </h2>

              {/* Required Documents */}
              {opp.required_documents && opp.required_documents.length > 0 && (
                <SectionCard title="Required Documents" icon={<FileText className="w-5 h-5" />} className="border-l-4 border-l-amber-400">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Have these ready before you apply:</p>
                  <RequiredDocuments documents={opp.required_documents} />
                </SectionCard>
              )}

              {/* Application Method Card - Dynamic with instructions */}
              <SectionCard title="Application Process" icon={<Zap className="w-5 h-5" />} className="border-l-4 border-l-emerald-500">
                <ApplicationMethodCard opportunity={{
                  title: opp.title,
                  extra_metadata: opp.extra_metadata,
                  application_method: opp.application_method,
                  canonical_link: opp.canonical_link ?? undefined,
                  application_url: opp.application_url ?? undefined,
                  contact_email: opp.contact_email ?? undefined,
                  contact_phone: opp.contact_phone ?? undefined,
                  contact_website: opp.contact_website ?? undefined,
                  contact_address: opp.contact_address ?? undefined,
                  contact_whatsapp: opp.contact_whatsapp ?? undefined,
                }} />
              </SectionCard>

              {/* Contact Section - All contact methods */}
              {(opp.contact_email || opp.contact_phone || opp.contact_website || opp.extra_metadata?.spider_contacts) && (
                <SectionCard title="Contact Information" icon={<Phone className="w-5 h-5" />}>
                  <ContactSection 
                    contact={{
                      phone: opp.contact_phone ?? undefined,
                      email: opp.contact_email ?? undefined,
                      website: opp.contact_website ?? undefined,
                      application_url: opp.application_url ?? undefined,
                      whatsapp: opp.contact_whatsapp ?? undefined,
                      fax: opp.contact_fax ?? undefined,
                    }}
                    extra_metadata={opp.extra_metadata}
                  />
                </SectionCard>
              )}
            </div>

            {/* Safety Tips Section */}
            <SafetyTips />

            {/* Vouch Section */}
            <VouchSection 
              opportunityId={opp.id} 
              vouchPositive={opp.vouch_positive} 
              vouchNegative={opp.vouch_negative} 
            />

            {/* Similar Opportunities */}
            {related_opportunities.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> Similar Opportunities
                </h2>
                <div className="space-y-3">
                  {related_opportunities.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/opportunities/${rel.id}`}
                      className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {rel.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {rel.company_name}{rel.location ? ` • ${rel.location}` : ""}
                        </p>
                      </div>
                      {rel.salary_range && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                          {rel.salary_range}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <QuickActions 
              opportunity={{
                canonical_link: opp.canonical_link ?? undefined,
                application_url: opp.application_url ?? undefined,
                contact_website: opp.contact_website ?? undefined,
                source_url: opp.source_url ?? undefined,
              }}
              isSaved={is_saved}
              onSave={handleSaveJob}
              onShare={() => setIsShareOpen(true)}
              onApply={() => {
                const url = opp.canonical_link || opp.application_url || opp.contact_website || opp.source_url;
                if (url) window.open(url, '_blank');
              }}
            />

            {/* Key Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Key Details</h3>
              <dl className="space-y-4">
                {salary && opp.salary_visible !== false && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Salary</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> {salary}
                    </dd>
                  </div>
                )}
                {opp.industry && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Industry</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{opp.industry}</dd>
                  </div>
                )}
                {opp.opportunity_type && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Type</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{opp.opportunity_type}</dd>
                  </div>
                )}
                {opp.remote_type && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Work mode</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{opp.remote_type}</dd>
                  </div>
                )}
                {opp.experience_level && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Experience</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{opp.experience_level}</dd>
                  </div>
                )}
                {opp.duration && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Duration</dt>
                    <dd className="text-sm font-medium text-teal-600 dark:text-teal-400">{opp.duration}</dd>
                  </div>
                )}
                {startDate && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Start date</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">{startDate}</dd>
                  </div>
                )}
                {deadline && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Application deadline</dt>
                    <dd className={`text-sm font-medium flex items-center gap-1.5 ${deadlineDays !== null && deadlineDays <= 7 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                      <Calendar className="w-4 h-4" /> {deadline}
                    </dd>
                  </div>
                )}
                {postedDate && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Posted</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-400">{postedDate}</dd>
                  </div>
                )}
                {opp.source_platform && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Source</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-400 capitalize">{opp.source_platform}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Scam score indicator */}
            {opp.scam_score != null && (
              <div className={`rounded-2xl p-5 border ${
                opp.scam_score >= 0.6
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {opp.scam_score >= 0.6
                    ? <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    : <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  <p className={`text-sm font-semibold ${opp.scam_score >= 0.6 ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                    {opp.scam_score >= 0.6 ? "Caution advised" : "Appears legitimate"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI trust analysis: {Math.round((1 - opp.scam_score) * 100)}% confidence this is a genuine listing.
                </p>
              </div>
            )}

            {/* Verification required */}
            {(opp.verified_candidates_only || (opp.requires_verification_level ?? 0) > 0) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Verification Required</h3>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  {opp.requires_verification_level === 3
                    ? "Identity verification (L3) required to apply."
                    : opp.requires_verification_level === 2
                      ? "Employment verification (L2) required to apply."
                      : "Skills verification (L1) required to apply."}{" "}
                  Complete your Proofile verification to unlock this opportunity.
                </p>
                <Link href="/verification" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline">
                  Get verified →
                </Link>
              </div>
            )}

            {/* External listing safety tip */}
            {!opp.is_direct && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-5 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    This listing was aggregated from an external source. Never pay any fee to apply. If you receive suspicious requests, report them.
                  </p>
                </div>
              </div>
            )}

            {/* Gap Analysis CTA */}
            <Link
              href={`/opportunities/${opp.id}/gap-analysis`}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl text-white hover:from-emerald-700 hover:to-teal-600 transition-all shadow-sm shadow-emerald-600/20"
            >
              <div>
                <p className="font-semibold text-sm">Skills Gap Analysis</p>
                <p className="text-xs text-emerald-100 mt-0.5">See what you&apos;re missing</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <MobileCTA 
        opportunity={{
          canonical_link: opp.canonical_link ?? undefined,
          application_url: opp.application_url ?? undefined,
          contact_website: opp.contact_website ?? undefined,
          source_url: opp.source_url ?? undefined,
        }}
        isSaved={is_saved}
        onSave={handleSaveJob}
        onApply={() => {
          const url = opp.canonical_link || opp.application_url || opp.contact_website || opp.source_url;
          if (url) window.open(url, '_blank');
        }}
      />

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        opportunity={{
          id: opp.id,
          title: opp.title,
          company_name: opp.company_name,
        }}
      />
    </div>
  );
}

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      }
    >
      <JobDetailsContent id={resolvedParams.id} />
    </Suspense>
  );
}
