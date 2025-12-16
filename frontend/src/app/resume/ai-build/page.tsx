"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added Link import
import { ArrowLeft, Sparkles, Briefcase, FileText, Palette, MessageSquare, Clock, Wand2, Loader2, Database } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import SignUpModal from '@/components/auth/SignUpModal';

import { toast } from "@/lib/toast";
import { startAIBuild } from "@/services/resumeService";

// Placeholder data for styles, tones, and lengths
const STYLES = [
    { id: "modern", label: "Modern Clean" },
    { id: "classic", label: "Classic Traditional" },
    { id: "minimal", label: "Minimalist" },
];

const TONES = [
    { id: "professional", label: "Professional (Standard)" },
    { id: "creative", label: "Creative & Bold" },
    { id: "technical", label: "Technical & Precise" },
    { id: "executive", label: "Executive & Strategic" },
];

const LENGTHS = [
    { id: "standard", label: "Standard (1 Page)" },
    { id: "detailed", label: "Detailed (2 Pages)" },
    { id: "concise", label: "Concise (Short)" },
];


export default function AIBuildLandingPage() {
    const router = useRouter();
    const { user, loading } = useAuth(); // Integrated useAuth hook
    const [targetRole, setTargetRole] = useState("");
    const [jobDescription, setJobDescription] = useState(""); // New state
    const [selectedStyle, setSelectedStyle] = useState("modern"); // Renamed from 'style'
    const [selectedTone, setSelectedTone] = useState("professional"); // Renamed from 'tone'
    const [selectedLength, setSelectedLength] = useState("standard"); // New state
    const [advancedOptions, setAdvancedOptions] = useState({}); // New state, for future use
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false); // New state

    if (!loading && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
                <div className="text-center max-w-md">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Free Proofile to Use AI Builder</h1>
                    <p className="mb-8 text-gray-600 dark:text-gray-400">
                        Our AI Resume Builder analyzes your professional profile to generate tailored resumes. 
                        Please sign up or log in to continue.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => setIsSignUpModalOpen(true)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Create Free Account
                        </button>
                        <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
                            Already have an account? Log in
                        </Link>
                    </div>
                </div>
                <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} triggerAction="ai" />
            </div>
        );
    }

    const handleGenerate = async () => { // Renamed from handleStart
        if (!user) {
            setIsSignUpModalOpen(true);
            return;
        }

        if (!targetRole) {
            toast.error("Please enter a target role");
            return;
        }

        setIsGenerating(true);
        try {
            // Start the build process
            const response = await startAIBuild({
                target_role: targetRole,
                job_description: jobDescription,
                style: selectedStyle,
                tone: selectedTone,
                length: selectedLength,
                advanced_options: advancedOptions
            });

            // Navigate to processing page with job ID
            router.push(`/resume/ai-build/processing?jobId=${response.job_id}`);
        } catch (error) {
            console.error("Failed to start AI build:", error);
            toast.error("Failed to start generation", "Please try again");
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/start')}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium hidden sm:inline">Back</span>
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                        
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Build Your Perfect Resume with AI
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Tell us about your target role, and our AI will craft a professional, ATS-optimized resume tailored just for you.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Main Input Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Target Role
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        placeholder="e.g. Senior Product Manager"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Job Description (Optional)
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Paste the job description here for better matching..."
                                        rows={4}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Options */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Style Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-purple-600">
                                <Palette size={20} />
                                <h3 className="font-semibold">Visual Style</h3>
                            </div>
                            <div className="space-y-2">
                                {STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${selectedStyle === style.id
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tone Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-blue-600">
                                <MessageSquare size={20} />
                                <h3 className="font-semibold">Writing Tone</h3>
                            </div>
                            <div className="space-y-2">
                                {TONES.map(tone => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setSelectedTone(tone.id)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${selectedTone === tone.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {tone.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Length Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-green-600">
                                <Clock size={20} />
                                <h3 className="font-semibold">Resume Length</h3>
                            </div>
                            <div className="space-y-2">
                                {LENGTHS.map(length => (
                                    <button
                                        key={length.id}
                                        onClick={() => setSelectedLength(length.id)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${selectedLength === length.id
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {length.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Data Source Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-6 border border-purple-100 dark:border-purple-800 flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <Database className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                Powered by Your Data
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                We'll use your existing profile data, uploaded resumes, and activity history to construct the most accurate representation of your professional journey.
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !targetRole}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Initializing AI...
                            </>
                        ) : (
                            <>
                                <Wand2 />
                                Generate My Resume
                            </>
                        )}
                    </button>
                </div>
            </main>

            <SignUpModal
                isOpen={isSignUpModalOpen}
                onClose={() => setIsSignUpModalOpen(false)}
                triggerAction="ai"
            />
        </div>
    );
}
