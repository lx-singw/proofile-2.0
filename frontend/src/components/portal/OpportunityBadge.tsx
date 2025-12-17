"use client";

import React from "react";
import {
    Briefcase,
    GraduationCap,
    BookOpen,
    Wrench,
    Users,
    Award,
    Handshake,
    Building2
} from "lucide-react";

type OpportunityType =
    | "employment"
    | "contract"
    | "freelance"
    | "consulting"
    | "board"
    | "volunteer"
    | "internship"
    | "learnership"
    | "apprenticeship";

type OpportunityCategory = "jobs" | "training_skills_programs";

interface OpportunityBadgeProps {
    type?: string;
    category?: string;
    size?: "sm" | "md";
    showIcon?: boolean;
}

// Badge configuration for each opportunity type
const BADGE_CONFIG: Record<OpportunityType, {
    label: string;
    icon: React.ElementType;
    bgClass: string;
    textClass: string;
}> = {
    employment: {
        label: "Employment",
        icon: Briefcase,
        bgClass: "bg-blue-100 dark:bg-blue-900/30",
        textClass: "text-blue-700 dark:text-blue-400"
    },
    contract: {
        label: "Contract",
        icon: Handshake,
        bgClass: "bg-orange-100 dark:bg-orange-900/30",
        textClass: "text-orange-700 dark:text-orange-400"
    },
    freelance: {
        label: "Freelance",
        icon: Users,
        bgClass: "bg-purple-100 dark:bg-purple-900/30",
        textClass: "text-purple-700 dark:text-purple-400"
    },
    consulting: {
        label: "Consulting",
        icon: Building2,
        bgClass: "bg-indigo-100 dark:bg-indigo-900/30",
        textClass: "text-indigo-700 dark:text-indigo-400"
    },
    board: {
        label: "Board",
        icon: Award,
        bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
        textClass: "text-yellow-700 dark:text-yellow-400"
    },
    volunteer: {
        label: "Volunteer",
        icon: Users,
        bgClass: "bg-pink-100 dark:bg-pink-900/30",
        textClass: "text-pink-700 dark:text-pink-400"
    },
    internship: {
        label: "Internship",
        icon: GraduationCap,
        bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
        textClass: "text-emerald-700 dark:text-emerald-400"
    },
    learnership: {
        label: "Learnership",
        icon: BookOpen,
        bgClass: "bg-teal-100 dark:bg-teal-900/30",
        textClass: "text-teal-700 dark:text-teal-400"
    },
    apprenticeship: {
        label: "Apprenticeship",
        icon: Wrench,
        bgClass: "bg-cyan-100 dark:bg-cyan-900/30",
        textClass: "text-cyan-700 dark:text-cyan-400"
    }
};

// Default config for unknown types
const DEFAULT_CONFIG = {
    label: "Opportunity",
    icon: Briefcase,
    bgClass: "bg-gray-100 dark:bg-gray-700",
    textClass: "text-gray-700 dark:text-gray-300"
};

export default function OpportunityBadge({
    type,
    category,
    size = "sm",
    showIcon = true
}: OpportunityBadgeProps) {
    // Get config for the opportunity type
    const config = type && BADGE_CONFIG[type as OpportunityType]
        ? BADGE_CONFIG[type as OpportunityType]
        : DEFAULT_CONFIG;

    const Icon = config.icon;

    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-3 py-1 text-sm";

    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

    return (
        <span
            className={`
                inline-flex items-center gap-1 
                ${sizeClasses}
                ${config.bgClass} 
                ${config.textClass} 
                font-medium rounded-full
            `}
        >
            {showIcon && <Icon className={iconSize} />}
            {config.label}
        </span>
    );
}

// Export for use in parent components
export { BADGE_CONFIG, type OpportunityType, type OpportunityCategory };
