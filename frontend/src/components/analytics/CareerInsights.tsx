"use client";

import React from "react";
import {
    TrendingUp,
    Target,
    Award,
    Briefcase,
    GraduationCap,
    Lightbulb,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CareerInsight {
    id: string;
    type: "trend" | "opportunity" | "skill_gap" | "milestone";
    title: string;
    description: string;
    actionUrl?: string;
    actionLabel?: string;
}

interface CareerInsightsProps {
    insights: CareerInsight[];
    isLoading?: boolean;
}

export function CareerInsights({ insights, isLoading }: CareerInsightsProps) {
    const getInsightIcon = (type: CareerInsight["type"]) => {
        const icons = {
            trend: <TrendingUp className="w-4 h-4 text-blue-500" />,
            opportunity: <Briefcase className="w-4 h-4 text-green-500" />,
            skill_gap: <GraduationCap className="w-4 h-4 text-orange-500" />,
            milestone: <Award className="w-4 h-4 text-purple-500" />,
        };
        return icons[type];
    };

    const getInsightStyles = (type: CareerInsight["type"]) => {
        const styles = {
            trend: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10",
            opportunity: "border-l-green-500 bg-green-50 dark:bg-green-900/10",
            skill_gap: "border-l-orange-500 bg-orange-50 dark:bg-orange-900/10",
            milestone: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/10",
        };
        return styles[type];
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400">Analyzing your career data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Career Insights
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Personalized recommendations based on your profile and industry trends
                </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`p-4 border-l-4 ${getInsightStyles(insight.type)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {insight.description}
                                </p>
                                {insight.actionUrl && (
                                    <Link
                                        href={insight.actionUrl}
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium mt-2 hover:underline"
                                    >
                                        {insight.actionLabel || "Learn more"}
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Sample data generator
export function generateSampleInsights(): CareerInsight[] {
    return [
        {
            id: "1",
            type: "trend",
            title: "AI/ML skills are trending in your industry",
            description: "Professionals with AI skills are seeing 35% more job opportunities. Consider adding relevant certifications.",
            actionUrl: "/profile/edit",
            actionLabel: "Add skills",
        },
        {
            id: "2",
            type: "opportunity",
            title: "5 companies are actively hiring for your role",
            description: "Based on your experience and skills, you match well with current openings at top companies.",
            actionUrl: "/jobs",
            actionLabel: "View jobs",
        },
        {
            id: "3",
            type: "skill_gap",
            title: "System Design is common in senior roles",
            description: "78% of senior engineers in your field have System Design experience. Consider upskilling.",
            actionUrl: "/resume/ai-build",
            actionLabel: "Get recommendations",
        },
        {
            id: "4",
            type: "milestone",
            title: "You reached 100 profile views this month!",
            description: "Your profile visibility is increasing. Keep your content fresh to maintain momentum.",
        },
    ];
}
