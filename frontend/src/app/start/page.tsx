"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileText, Sparkles, ArrowRight, ArrowLeft, LogIn } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";

export default function StartPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                    <ProofileLogo size={32} showWordmark={true} />
                </div>
            </header>

            <main className="max-w-6xl mx-auto py-16 px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Choose Your Path
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Select the best way to create your professional resume and start building your verified Proofile.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Option 1: Upload Resume */}
                    <Link href="/resume/upload" className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl transform hover:-translate-y-1">
                        <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                            AI Refined
                        </div>
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Upload Resume
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Upload your existing resume for AI-powered refinement
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                            Start Upload
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </div>
                    </Link>

                    {/* Option 2: Build from Scratch */}
                    <Link href="/resume/build" className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-xl transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Build from Scratch
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create a professional resume with our guided builder
                        </p>
                        <div className="flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:gap-2 transition-all">
                            Start Building
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </div>
                    </Link>

                    {/* Option 3: AI Build from Profile */}
                    <Link href="/resume/ai-build" className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-xl transform hover:-translate-y-1">
                        <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Powered
                        </div>
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            AI Build from Profile
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Let AI create a polished resume using your profile data
                        </p>
                        <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all">
                            Generate with AI
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </div>
                    </Link>

                    {/* Option 4: Sign Up / Sign In */}
                    <Link href="/login" className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500 transition-all hover:shadow-xl transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LogIn className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Sign Up / Sign In
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Access your existing account or create a new one
                        </p>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 font-semibold group-hover:gap-2 transition-all">
                            Login / Register
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
