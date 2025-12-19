"use client";

import React from "react";
import { Briefcase, GraduationCap, Search, Users } from "lucide-react";

export type UserStatus = "open_to_work" | "hiring" | "learning" | "exploring" | null;

interface StatusIndicatorProps {
    status: UserStatus;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

const STATUS_CONFIG: Record<NonNullable<UserStatus>, {
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    ringColor: string;
}> = {
    open_to_work: {
        label: "Open to Work",
        icon: <Briefcase className="w-3 h-3" />,
        bgColor: "bg-emerald-500",
        textColor: "text-white",
        ringColor: "ring-emerald-500/30",
    },
    hiring: {
        label: "Hiring",
        icon: <Users className="w-3 h-3" />,
        bgColor: "bg-purple-500",
        textColor: "text-white",
        ringColor: "ring-purple-500/30",
    },
    learning: {
        label: "Learning",
        icon: <GraduationCap className="w-3 h-3" />,
        bgColor: "bg-blue-500",
        textColor: "text-white",
        ringColor: "ring-blue-500/30",
    },
    exploring: {
        label: "Exploring",
        icon: <Search className="w-3 h-3" />,
        bgColor: "bg-amber-500",
        textColor: "text-white",
        ringColor: "ring-amber-500/30",
    },
};

export function StatusIndicator({ status, size = "sm", showLabel = true }: StatusIndicatorProps) {
    if (!status) return null;

    const config = STATUS_CONFIG[status];

    const sizeClasses = {
        sm: "text-[10px] px-2 py-0.5 gap-1",
        md: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3 py-1.5 gap-2",
    };

    return (
        <div
            className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ring-2 ${config.ringColor}`}
        >
            {config.icon}
            {showLabel && <span>{config.label}</span>}
        </div>
    );
}

interface StatusBadgeRingProps {
    status: UserStatus;
    children: React.ReactNode;
}

/**
 * Wraps an avatar with a colored ring based on user status
 */
export function StatusBadgeRing({ status, children }: StatusBadgeRingProps) {
    if (!status) {
        return <>{children}</>;
    }

    const config = STATUS_CONFIG[status];

    return (
        <div className={`relative p-0.5 rounded-full ${config.bgColor}`}>
            {children}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                {config.icon}
            </div>
        </div>
    );
}

interface StatusSelectorProps {
    currentStatus: UserStatus;
    onStatusChange: (status: UserStatus) => void;
}

export function StatusSelector({ currentStatus, onStatusChange }: StatusSelectorProps) {
    const statuses: (UserStatus)[] = ["open_to_work", "hiring", "learning", "exploring", null];

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Status
            </label>
            <div className="flex flex-wrap gap-2">
                {statuses.map((status) => {
                    const isSelected = currentStatus === status;

                    if (status === null) {
                        return (
                            <button
                                key="none"
                                onClick={() => onStatusChange(null)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                None
                            </button>
                        );
                    }

                    const config = STATUS_CONFIG[status];
                    return (
                        <button
                            key={status}
                            onClick={() => onStatusChange(status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                    ? `${config.bgColor} ${config.textColor}`
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            {config.icon}
                            {config.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                This will be visible on your profile and feed posts.
            </p>
        </div>
    );
}

export default StatusIndicator;
