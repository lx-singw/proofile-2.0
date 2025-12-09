"use client";

export const dynamic = "force-dynamic";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Link from "next/link";
import {
    Bot,
    Sparkles,
    Lightbulb,
    Target,
    TrendingUp,
    CheckCircle,
    ArrowRight,
    Plus,
    Star,
    Shield,
    Briefcase,
    GraduationCap,
    Award,
    MessageCircle,
    Send,
    Loader2,
    ChevronRight,
    Zap,
    Brain,
    BarChart3,
    AlertCircle
} from "lucide-react";
import * as aiChatService from "@/services/aiChatService";
import type { ProfileAnalysis, ProfileInsight } from "@/services/aiChatService";

interface QuickWin {
    id: string;
    title: string;
    description: string;
    impact: string;
    action: string;
    actionLink: string;
    icon: React.ReactNode;
    priority: "high" | "medium" | "low";
}

interface CareerOpportunity {
    title: string;
    level: string;
    matchScore: number;
    skillGaps: string[];
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function AIAssistantPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [chatInput, setChatInput] = useState("");
    const [chatSessionId, setChatSessionId] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(true);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/ai-assistant');
        }
    }, [user, loading, router]);

    // Fetch profile analysis from API
    useEffect(() => {
        async function fetchAnalysis() {
            if (!user) return;
            
            try {
                setAnalysisLoading(true);
                setAnalysisError(null);
                const analysis = await aiChatService.getProfileAnalysis();
                setProfileAnalysis(analysis);
                
                // Set initial greeting message
                setChatMessages([{
                    id: "1",
                    role: "assistant",
                    content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your AI Career Assistant. I've analyzed your profile - you're at ${analysis.completeness_score}% completion. How can I help you today?`,
                    timestamp: new Date()
                }]);
            } catch (error) {
                console.error("Failed to fetch profile analysis:", error);
                setAnalysisError("Failed to load profile analysis");
                // Set fallback greeting
                setChatMessages([{
                    id: "1",
                    role: "assistant",
                    content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your AI Career Assistant. How can I help you with your career today?`,
                    timestamp: new Date()
                }]);
            } finally {
                setAnalysisLoading(false);
            }
        }
        
        if (user) {
            fetchAnalysis();
        }
    }, [user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!user) return null;

    // Convert API insights to QuickWins format
    const getIconForCategory = (category: string) => {
        switch (category) {
            case "profile": return <Plus className="w-5 h-5" />;
            case "skills": return <Star className="w-5 h-5" />;
            case "growth": return <Shield className="w-5 h-5" />;
            default: return <Lightbulb className="w-5 h-5" />;
        }
    };

    const quickWins: QuickWin[] = profileAnalysis?.improvements?.map((insight: ProfileInsight, idx: number) => ({
        id: String(idx + 1),
        title: insight.title,
        description: insight.description,
        impact: `Priority: ${insight.priority}`,
        action: "Take Action",
        actionLink: insight.action_url || "/profile",
        icon: getIconForCategory(insight.category),
        priority: insight.priority
    })) || [];

    // Career opportunities from analysis
    const careerOpportunities: CareerOpportunity[] = profileAnalysis?.career_opportunities?.map((opp: string, idx: number) => ({
        title: opp,
        level: idx === 0 ? "Recommended" : `Option ${idx + 1}`,
        matchScore: Math.max(50, 95 - (idx * 15)),
        skillGaps: profileAnalysis?.skill_gaps?.slice(0, 2) || []
    })) || [];

    const profileCompleteness = profileAnalysis?.completeness_score ?? 0;

    // Suggested skills based on skill gaps
    const suggestedSkills = (profileAnalysis?.skill_gaps || []).map((skill: string, idx: number) => ({
        name: skill,
        relevance: Math.max(70, 95 - (idx * 5))
    })).slice(0, 5);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        const messageToSend = chatInput;
        setChatInput("");
        setIsTyping(true);

        try {
            // Call real AI chat API
            const response = await aiChatService.sendChatMessage(
                messageToSend,
                chatSessionId || undefined,
                "career_coach"
            );
            
            // Store session ID for continued conversation
            if (!chatSessionId) {
                setChatSessionId(response.session_id);
            }

            const assistantMessage: ChatMessage = {
                id: response.assistant_message.id.toString(),
                role: "assistant",
                content: response.assistant_message.content,
                timestamp: new Date(response.assistant_message.created_at)
            };

            setChatMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to send message:", error);
            // Show error message
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm sorry, I encountered an error. Please try again.",
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
            case "medium": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
            case "low": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
            default: return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                AI Career Assistant
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Personalized insights to accelerate your career growth
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Insights & Quick Wins */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Analysis Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    Profile Analysis
                                </h2>
                                <div className="text-sm text-gray-500">Updated just now</div>
                            </div>

                            <div className="flex items-center gap-6 mb-6">
                                <div className="relative w-24 h-24">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-gray-200 dark:text-gray-700"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 40 * profileCompleteness / 100} ${2 * Math.PI * 40}`}
                                            className="text-green-500"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{profileCompleteness}%</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profile Strength</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        You're on your way! Complete the quick wins below to reach 90% and significantly boost your visibility.
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Email verified</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Basic info complete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Wins */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                Quick Wins
                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                    Do these now
                                </span>
                            </h2>

                            <div className="space-y-4">
                                {quickWins.map((win) => (
                                    <div
                                        key={win.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                {win.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {win.title}
                                                    </h4>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(win.priority)}`}>
                                                        {win.priority}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {win.description}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span>{win.impact}</span>
                                                </div>
                                            </div>
                                            <Link
                                                href={win.actionLink}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 flex-shrink-0"
                                            >
                                                {win.action}
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Career Growth Opportunities */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Target className="w-5 h-5 text-blue-500" />
                                Career Growth Opportunities
                            </h2>

                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Based on your skills and experience, you're ready for these roles:
                            </p>

                            <div className="space-y-4">
                                {careerOpportunities.map((opp, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {opp.title}
                                                </h4>
                                                <span className="text-xs text-gray-500">{opp.level}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {opp.matchScore}%
                                                    </span>
                                                    <span className="text-xs text-gray-500 block">match</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                style={{ width: `${opp.matchScore}%` }}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-500">Skill gaps:</span>
                                            {opp.skillGaps.map((skill, skillIdx) => (
                                                <span
                                                    key={skillIdx}
                                                    className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Chat & Skills */}
                    <div className="space-y-8">
                        {/* AI Chat */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-600">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                    Ask AI Anything
                                </h3>
                                <p className="text-sm text-purple-100">Get personalized career advice</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] p-3 rounded-2xl ${
                                                msg.role === "user"
                                                    ? "bg-green-600 text-white rounded-br-sm"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                                            }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-bl-sm">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Ask about your career..."
                                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isTyping}
                                        className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Suggested Skills */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                Suggested Skills to Add
                            </h3>

                            <div className="space-y-3">
                                {suggestedSkills.map((skill, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                {skill.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{skill.relevance}% relevant</span>
                                            <button className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/profile/edit"
                                className="mt-4 w-full py-2 text-center text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
                            >
                                Add All Skills
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Job Match Stats */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                                AI Job Matching
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Jobs analyzed today</span>
                                    <span className="font-bold text-gray-900 dark:text-white">247</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Strong matches</span>
                                    <span className="font-bold text-green-600">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Profile views by recruiters</span>
                                    <span className="font-bold text-gray-900 dark:text-white">8 this week</span>
                                </div>
                            </div>

                            <Link
                                href="/jobs"
                                className="mt-4 w-full py-3 bg-green-600 text-white text-center font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Briefcase className="w-5 h-5" />
                                View Matched Jobs
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
