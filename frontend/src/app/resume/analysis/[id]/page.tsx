"use client";

import React, { useEffect, useState } from "react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { useRouter } from "next/navigation";
import { getResumeAnalysis } from "@/services/resumeService";

export default function ResumeAnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const result = await getResumeAnalysis(id as string);
        setAnalysis(result);
      } catch (err) {
        setError("Failed to fetch analysis.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchAnalysis();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading analysis...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <ProofileLogo size={32} showWordmark={true} />
        <div className="flex items-center gap-4">
          <a href="/resume/upload" className="text-sm text-gray-500 hover:text-green-600">Back to Upload</a>
          <button className="bg-green-600 text-white px-4 py-1 rounded font-semibold hover:bg-green-700">Download</button>
          <button className="bg-gray-200 text-gray-700 px-4 py-1 rounded font-semibold hover:bg-gray-300">Edit</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-2">Resume Analysis: {analysis.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{analysis.score}/100</div>
            <div className="text-lg font-semibold mb-2">Good</div>
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
              {/* Circular progress placeholder */}
              <span className="text-2xl font-bold text-green-600">{analysis.score}%</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
            <div className="text-sm mb-2">📄 {analysis.stats.pages} Page</div>
            <div className="text-sm mb-2">💼 {analysis.stats.experience} Experience</div>
            <div className="text-sm mb-2">🎯 {analysis.stats.role}</div>
            <div className="text-sm mb-2">📍 {analysis.stats.location}</div>
            <div className="text-sm mb-2">⚡ {analysis.stats.words} Words</div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">Key Insights</h2>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-300 text-sm space-y-1">
            {analysis.insights.map((insight, idx) => (
              <li key={idx}>{insight}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">Detailed Scores</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>ATS Compatibility: <span className="font-bold">{analysis.scores.ats}/100</span></li>
            <li>Content Quality: <span className="font-bold">{analysis.scores.content}/100</span></li>
            <li>Formatting & Design: <span className="font-bold">{analysis.scores.formatting}/100</span></li>
            <li>Keyword Optimization: <span className="font-bold">{analysis.scores.keywords}/100</span></li>
            <li>Impact & Achievements: <span className="font-bold">{analysis.scores.impact}/100</span></li>
            <li>Completeness: <span className="font-bold">{analysis.scores.completeness}/100</span></li>
          </ul>
        </div>
        <button className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded font-semibold hover:bg-gray-200 dark:hover:bg-gray-700">Show Detailed Analysis ▼</button>
      </main>
    </div>
  );
}
