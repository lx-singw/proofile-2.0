"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    countMap?: Record<string, number>;
}

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "credentials", label: "Credentials" },
    { id: "activity", label: "Activity" }
];

export function ProfileTabs({ activeTab, onTabChange, countMap }: ProfileTabsProps) {
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-16 z-30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="-mb-px flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors relative",
                                    isActive
                                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                )}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {tab.label}
                                {countMap && countMap[tab.id] !== undefined && (
                                    <span className={cn(
                                        "ml-2 py-0.5 px-2 rounded-full text-xs font-medium",
                                        isActive
                                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
                                    )}>
                                        {countMap[tab.id]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
