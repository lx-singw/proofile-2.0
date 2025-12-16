"use client";

import React from "react";
import {
    Inbox,
    Search,
    AlertCircle,
    CheckCircle,
    FileText,
    Users,
    Briefcase,
    Star,
    Shield,
    Sparkles
} from "lucide-react";
import Link from "next/link";

type EmptyStateVariant =
    | "no-data"
    | "no-results"
    | "error"
    | "success"
    | "no-jobs"
    | "no-reviews"
    | "no-experience"
    | "no-skills"
    | "no-verification"
    | "coming-soon";

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
}

const VARIANTS: Record<EmptyStateVariant, {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    defaultTitle: string;
    defaultDescription: string;
}> = {
    "no-data": {
        icon: Inbox,
        iconColor: "text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-800",
        defaultTitle: "Nothing here yet",
        defaultDescription: "Get started by adding some data.",
    },
    "no-results": {
        icon: Search,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        defaultTitle: "No results found",
        defaultDescription: "Try adjusting your search or filters.",
    },
    "error": {
        icon: AlertCircle,
        iconColor: "text-red-500",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        defaultTitle: "Something went wrong",
        defaultDescription: "We couldn't load this content. Please try again.",
    },
    "success": {
        icon: CheckCircle,
        iconColor: "text-green-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        defaultTitle: "All done!",
        defaultDescription: "Everything is up to date.",
    },
    "no-jobs": {
        icon: Briefcase,
        iconColor: "text-purple-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        defaultTitle: "No job matches yet",
        defaultDescription: "Complete your profile to get personalized job recommendations.",
    },
    "no-reviews": {
        icon: Star,
        iconColor: "text-yellow-500",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        defaultTitle: "No reviews yet",
        defaultDescription: "Request ratings from colleagues to build your reputation.",
    },
    "no-experience": {
        icon: FileText,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        defaultTitle: "No experience added",
        defaultDescription: "Add your work history to showcase your professional journey.",
    },
    "no-skills": {
        icon: Sparkles,
        iconColor: "text-indigo-500",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        defaultTitle: "No skills added",
        defaultDescription: "Add your skills to help employers find you.",
    },
    "no-verification": {
        icon: Shield,
        iconColor: "text-green-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        defaultTitle: "Nothing to verify",
        defaultDescription: "All your verifications are complete!",
    },
    "coming-soon": {
        icon: Sparkles,
        iconColor: "text-purple-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        defaultTitle: "Coming Soon",
        defaultDescription: "We're working on something exciting. Stay tuned!",
    },
};

/**
 * EmptyState - Friendly empty state component
 * 
 * Features:
 * - Multiple pre-built variants for common scenarios
 * - Customizable title, description, and action
 * - Consistent styling across the app
 * - Dark mode support
 */
export default function EmptyState({
    variant = "no-data",
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className = "",
}: EmptyStateProps) {
    const config = VARIANTS[variant];
    const Icon = config.icon;

    return (
        <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title || config.defaultTitle}
            </h3>

            {/* Description */}
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {description || config.defaultDescription}
            </p>

            {/* Action Button */}
            {(actionLabel && (actionHref || onAction)) && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    );
}
