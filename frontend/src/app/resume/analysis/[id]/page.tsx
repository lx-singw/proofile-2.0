"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { getResumeAnalysis } from "@/services/resumeService";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Edit, FileText, TrendingUp, Target, Award, CheckCircle, AlertCircle, XCircle, FileCheck, Sparkles, Key, Wand2, Layout } from "lucide-react";
import { ExpandablePanel, InsightItem, AIRefinementTools } from "@/components/resume/AnalysisComponents";
import { SkeletonAnalysis } from "@/components/feedback/SkeletonLoader";
import { toast } from "@/lib/toast";
import { ScoreGrid } from "@/components/resume/ScoreCharts";
import ResumeComparison from "@/components/resume/ResumeComparison";
import JobMatching from "@/components/resume/JobMatching";
import AIRewriteModal from "@/components/resume/AIRewriteModal";
import TemplateGallery from "@/components/resume/TemplateGallery";
import VersionHistory from "@/components/resume/VersionHistory";
import { History } from "lucide-react";
import SignUpModal from "@/components/auth/SignUpModal";
import useAuth from "@/hooks/useAuth";

export default function ResumeAnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<'save' | 'download' | 'ai' | 'apply_improvements'>('apply_improvements');
  const router = useRouter();
  const { user } = useAuth();

  const handleRestrictedAction = (action: 'save' | 'download' | 'ai' | 'apply_improvements') => {
    if (!user) {
      setPaywallTrigger(action);
      setShowPaywall(true);
      return true; // Action blocked
    }
    return false; // Action allowed
  };

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const result = await getResumeAnalysis(id as string);
        setAnalysis(result);
      } catch (err) {
        toast.error("Failed to fetch analysis", "Please try again");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
          
        </header>
        <main className="max-w-6xl mx-auto py-12 px-4">
          <SkeletonAnalysis />
        </main>
      </div>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/resume/upload")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Upload</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
          
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (handleRestrictedAction('download')) return;
              const dataStr = JSON.stringify(analysis, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${analysis.name}-analysis.json`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success("Analysis downloaded", "Saved as JSON file");
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => {
              if (handleRestrictedAction('save')) return;
              router.push(`/resume/build?id=${id}`);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              if (handleRestrictedAction('save')) return;
              setShowTemplateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Layout className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={() => {
              if (handleRestrictedAction('save')) return;
              setShowHistoryModal(true);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
            title="Version History"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Resume Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{analysis.name}</p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.score / 100)}`}
                    className={getScoreColor(analysis.score)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Overall Score
              </h3>
              <p className={`text-lg font-semibold ${getScoreColor(analysis.score)}`}>
                {getScoreLabel(analysis.score)}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{analysis.stats.pages} Page</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{analysis.stats.experience}</span>
              </div>
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{analysis.stats.role}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{analysis.stats.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{analysis.stats.words} Words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 shadow-lg border border-blue-200 dark:border-blue-800 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            Key Insights
          </h2>
          <ul className="space-y-2">
            {analysis.insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual Score Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Score Breakdown</h2>
          <ScoreGrid scores={analysis.scores} type="circle" />
        </div>

        {/* Improvement Potential */}
        <ResumeComparison
          currentScores={analysis.scores}
          improvements={[
            "Optimize keyword density for ATS systems",
            "Enhance action verbs in experience section",
            "Add quantifiable achievements with metrics",
            "Improve formatting for better readability",
            "Strengthen professional summary"
          ]}
        />

        {/* Expandable Detailed Analysis */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Detailed Analysis</h2>

          <ExpandablePanel
            title="ATS Compatibility"
            score={analysis.scores.ats}
            icon={<FileCheck className="w-5 h-5 text-white" />}
            defaultExpanded={true}
          >
            <div className="space-y-3">
              <InsightItem
                type="success"
                text="Your PDF is text-based and easily readable by ATS"
              />
              <InsightItem
                type="success"
                text="All major sections have clear, recognizable headers"
              />
              <InsightItem
                type="warning"
                text="Consider using standard fonts like Arial or Calibri for better compatibility"
                action={{ label: "Apply Fix", onClick: () => handleRestrictedAction('apply_improvements') }}
              />
            </div>
          </ExpandablePanel>

          <ExpandablePanel
            title="Content Quality"
            score={analysis.scores.content}
            icon={<Sparkles className="w-5 h-5 text-white" />}
          >
            <div className="space-y-3">
              <InsightItem
                type="success"
                text="87% of bullets start with strong action verbs"
              />
              <InsightItem
                type="warning"
                text="Only 45% of achievements include quantifiable metrics"
                action={{ label: "View Examples", onClick: () => handleRestrictedAction('apply_improvements') }}
              />
              <InsightItem
                type="warning"
                text="Professional summary could be more impactful (currently 45 words)"
                action={{ label: "Generate Better Summary", onClick: () => handleRestrictedAction('apply_improvements') }}
              />
            </div>
          </ExpandablePanel>

          <ExpandablePanel
            title="Keyword Optimization"
            score={analysis.scores.keywords}
            icon={<Key className="w-5 h-5 text-white" />}
          >
            <div className="space-y-3">
              <InsightItem
                type="error"
                text="Missing critical keywords: Product Roadmap, Stakeholder Management, A/B Testing"
                action={{ label: "Add Keywords", onClick: () => handleRestrictedAction('apply_improvements') }}
              />
              <InsightItem
                type="warning"
                text="Consider adding: Product-Market Fit, Data Analytics, Customer Journey"
              />
              <InsightItem
                type="success"
                text="Found relevant keywords: Agile, Scrum, Jira, User Research"
              />
            </div>
          </ExpandablePanel>
        </div>

        {/* AI Refinement Tools */}
        <AIRefinementTools onToolSelect={(tool) => {
          if (!user) {
            handleRestrictedAction('apply_improvements');
            return;
          }
          setSelectedTool(tool);
          setShowRewriteModal(true);
        }} />

        {/* Job Description Matching */}
        <JobMatching resumeId={id as string} resumeData={analysis} />

        {/* CTA */}
        <div className="text-center mt-8">
          <button onClick={() => handleRestrictedAction('apply_improvements')} className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
            Save Improvements & Export
          </button>
        </div>

        {/* AI Modal */}
        <AIRewriteModal
          isOpen={showRewriteModal}
          onClose={() => setShowRewriteModal(false)}
          resumeId={id as string}
          initialText={selectedTool === "summary" ? analysis?.summary : ""}
        />

        {/* Template Modal */}
        <TemplateGallery
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          currentTemplateId={analysis?.template_id || "modern"}
          onSelect={async (templateId) => {
            // Call API to update template
            await fetch(`/api/v1/resumes/${id}/template`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ template_id: templateId })
            });
            // Refresh analysis
            const result = await getResumeAnalysis(id as string);
            setAnalysis(result);
          }}
        />

        {/* History Modal */}
        <VersionHistory
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          resumeId={id as string}
          onRestore={async () => {
            const result = await getResumeAnalysis(id as string);
            setAnalysis(result);
          }}
        />

        {/* Paywall Modal */}
        <SignUpModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          triggerAction={paywallTrigger}
          score={analysis?.score}
        />
      </main>
    </div>
  );
}
