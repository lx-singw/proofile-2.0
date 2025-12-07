"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import ProofileLogo from "@/components/branding/ProofileLogo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ResumeRefinePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = [
    { key: "enhance", title: "Enhance Writing Quality", description: "Transform weak bullet points into impactful achievements", button: "Start Enhancement" },
    { key: "keywords", title: "Optimize Keywords", description: "Add missing industry-specific keywords automatically", button: "Add Keywords" },
    { key: "ats", title: "Improve ATS Compatibility", description: "Fix formatting issues that block ATS systems", button: "Fix ATS Issues" },
    { key: "summary", title: "Rewrite Professional Summary", description: "Generate a compelling summary based on your experience", button: "Generate Summary" },
    { key: "template", title: "Apply Professional Template", description: "Transform your resume with our premium designs", button: "Browse Templates" },
    { key: "full", title: "Full AI Makeover", description: "Let AI optimize everything at once (recommended)", button: "Start Full Refinement" },
  ];

  const handleRefine = async (actionKey: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE}/resume/${id}/refine`, null, { params: { action: actionKey } });
      setResult(res.data);
    } catch (err) {
      setError("Failed to apply refinement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <ProofileLogo size={32} showWordmark={true} />
        <div className="flex items-center gap-4">
          <Link href="/resume/analysis/1" className="text-sm text-gray-500 hover:text-green-600">Back to Analysis</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-2">AI Refinement Tools</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Choose what you'd like to improve:</p>
        <div className="space-y-6">
          {actions.map((action, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow flex flex-col gap-2">
              <div className="text-lg font-semibold">{action.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{action.description}</div>
              <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 w-fit" onClick={() => handleRefine(action.key)} disabled={loading}>{loading ? "Refining..." : action.button}</button>
              {result && result.action === action.key && (
                <div className="mt-2 text-green-700 dark:text-green-400 text-sm">
                  <div>Improvements:</div>
                  <ul className="list-disc ml-6">
                    {result.improvements.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              )}
              {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
