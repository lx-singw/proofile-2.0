"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Upload, Shield, Star, Briefcase, CheckCircle } from "lucide-react";

interface NextStepPromptProps {
    profileComplete: boolean;
    hasResume: boolean;
    isVerified: boolean;
    hasRatings: boolean;
    userName?: string;
}

/**
 * NextStepPrompt - Progressive Disclosure Component
 * 
 * Following "Don't Make Me Think" principles:
 * - Shows ONE clear next action
 * - Explains why it matters
 * - Shows what comes after
 * - Provides escape hatch
 */
export default function NextStepPrompt({
    profileComplete,
    hasResume,
    isVerified,
    hasRatings,
    userName = "there",
}: NextStepPromptProps) {
    const router = useRouter();

    // Determine the next step based on user's progress
    const getNextStep = () => {
        if (!hasResume) {
            return {
                icon: Upload,
                iconColor: "text-green-600 bg-green-100 dark:bg-green-900/30",
                title: "Create your first resume",
                description: "Upload or build a professional resume in 2 minutes",
                time: "2 min",
                action: "Create Resume",
                href: "/start",
                nextSteps: [
                    "Get verified credentials",
                    "Start getting matched to jobs",
                ],
                priority: "high",
            };
        }

        if (!isVerified) {
            return {
                icon: Shield,
                iconColor: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
                title: "Verify your work history",
                description: "Verified profiles get 3x more job opportunities",
                time: "5 min",
                action: "Get Verified",
                href: "/verification",
                nextSteps: [
                    "Unlock AI job matching",
                    "Get recruiter attention",
                ],
                priority: "high",
            };
        }

        if (!hasRatings) {
            return {
                icon: Star,
                iconColor: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
                title: "Get your first peer rating",
                description: "Invite a former colleague to rate your work",
                time: "1 min",
                action: "Request Rating",
                href: "/ratings/request",
                nextSteps: [
                    "Build trust with employers",
                    "Stand out from other candidates",
                ],
                priority: "medium",
            };
        }

        // Profile is complete - show job discovery
        return {
            icon: Briefcase,
            iconColor: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
            title: "Explore job matches",
            description: "See jobs matched to your verified profile",
            time: "",
            action: "View Jobs",
            href: "/jobs",
            nextSteps: [],
            priority: "low",
        };
    };

    const step = getNextStep();
    const Icon = step.icon;

    // Calculate completion percentage
    const completionSteps = [hasResume, isVerified, hasRatings];
    const completedCount = completionSteps.filter(Boolean).length;
    const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            {/* Progress Header */}
            {completionPercent < 100 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            🎯 Complete Your Profile
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {completionPercent}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-6">
                {/* Current Step */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${step.iconColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {step.description}
                        </p>
                        {step.time && (
                            <span className="inline-block mt-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                Takes {step.time}
                            </span>
                        )}
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={() => router.push(step.href)}
                    className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                    {step.action}
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Coming Next */}
                {step.nextSteps.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            Coming next
                        </p>
                        <div className="space-y-2">
                            {step.nextSteps.map((nextStep, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                        <span className="text-xs">{completedCount + index + 2}</span>
                                    </div>
                                    <span>{nextStep}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skip Option */}
                {step.priority === "high" && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => router.push("/feed")}
                            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </div>

            {/* Completed Items */}
            {completedCount > 0 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Completed
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {hasResume && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Resume
                            </span>
                        )}
                        {isVerified && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                        {hasRatings && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Rated
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
