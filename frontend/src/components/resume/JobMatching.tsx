"use client";

import { useState } from "react";
import { Target, TrendingUp, AlertTriangle, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface JobMatchingProps {
    resumeId: string;
    resumeData?: any;
}

export default function JobMatching({ resumeId, resumeData }: JobMatchingProps) {
    const [jobDescription, setJobDescription] = useState("");
    const [matching, setMatching] = useState(false);
    const [results, setResults] = useState<any>(null);

    const analyzeMatch = async () => {
        if (!jobDescription.trim()) {
            toast.error("Enter job description", "Please paste the job description to analyze");
            return;
        }

        setMatching(true);

        // Simulate API call with mock analysis
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock keyword extraction and matching
        const jobKeywords = extractKeywords(jobDescription);
        const resumeKeywords = resumeData?.keywords || ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL"];

        const matchingSkills = resumeKeywords.filter((skill: string) =>
            jobKeywords.some(jk => skill.toLowerCase().includes(jk.toLowerCase()) || jk.toLowerCase().includes(skill.toLowerCase()))
        );

        const missingSkills = jobKeywords.filter(jk =>
            !resumeKeywords.some((rk: string) => rk.toLowerCase().includes(jk.toLowerCase()))
        ).slice(0, 5);

        const matchPercentage = Math.round((matchingSkills.length / Math.max(jobKeywords.length, 1)) * 100);

        setResults({
            matchPercentage: Math.min(matchPercentage, 95),
            matchingSkills,
            missingSkills,
            suggestions: generateSuggestions(missingSkills, matchPercentage)
        });

        setMatching(false);
        toast.success("Analysis complete", `${matchPercentage}% match found`);
    };

    const extractKeywords = (text: string): string[] => {
        // Simple keyword extraction (in production, use NLP/AI)
        const commonWords = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);

        const keywords = Array.from(new Set(commonWords))
            .filter(word =>
                !['that', 'this', 'with', 'from', 'will', 'have', 'your', 'work', 'team', 'experience'].includes(word)
            );

        return keywords.slice(0, 15);
    };

    const generateSuggestions = (missing: string[], matchPct: number): string[] => {
        const suggestions = [];

        if (matchPct < 60) {
            suggestions.push("Consider tailoring your resume more closely to this role");
        }
        if (missing.length > 3) {
            suggestions.push(`Highlight experience with ${missing.slice(0, 2).join(" and ")} if applicable`);
        }
        if (matchPct >= 75) {
            suggestions.push("Strong match! Emphasize your relevant achievements");
        }
        suggestions.push("Add quantifiable metrics to strengthen your application");
        suggestions.push("Customize your professional summary for this role");

        return suggestions;
    };

    const getMatchColor = (percentage: number) => {
        if (percentage >= 75) return "text-green-600";
        if (percentage >= 50) return "text-emerald-600";
        return "text-red-600";
    };

    const getMatchLabel = (percentage: number) => {
        if (percentage >= 75) return "Excellent Match";
        if (percentage >= 50) return "Good Match";
        return "Needs Improvement";
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Job Description Match
                    </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    See how well your resume matches a specific job posting
                </p>
            </div>

            {/* Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste Job Description
                </label>
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Paste the full job description here..."
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                        {jobDescription.length} characters
                    </span>
                    <button
                        onClick={analyzeMatch}
                        disabled={matching || !jobDescription.trim()}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {matching ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Analyze Match
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            {results && (
                <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {/* Match Percentage */}
                    <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-xl">
                        <div className={`text-6xl font-bold ${getMatchColor(results.matchPercentage)} mb-2`}>
                            {results.matchPercentage}%
                        </div>
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            {getMatchLabel(results.matchPercentage)}
                        </div>
                    </div>

                    {/* Matching Skills */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Matching Skills ({results.matchingSkills.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {results.matchingSkills.map((skill: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Missing Skills */}
                    {results.missingSkills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-emerald-600" />
                                Skills to Highlight ({results.missingSkills.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {results.missingSkills.map((skill: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Recommendations
                        </h3>
                        <ul className="space-y-2">
                            {results.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2"></span>
                                    <span>{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
