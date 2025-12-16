"use client";

import { X, Layout, Eye, EyeOff } from 'lucide-react';
import type { DashboardPreferences } from '@/hooks/useDashboardPreferences';

interface CustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: DashboardPreferences;
    onToggleSection: (section: keyof DashboardPreferences['visibleSections']) => void;
}

const SECTION_LABELS: Record<keyof DashboardPreferences['visibleSections'], string> = {
    welcome: 'Welcome Header',
    stats: 'Statistics Overview',
    resumeTools: 'Resume Tools',
    profileVerification: 'Profile & Verification',
    jobDiscovery: 'Discover Opportunities',
    recentActivity: 'Recent Activity',
};

export default function CustomizationModal({
    isOpen,
    onClose,
    preferences,
    onToggleSection,
}: CustomizationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layout className="w-5 h-5 text-emerald-600" />
                        Customize Dashboard
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Toggle sections to show or hide them on your dashboard.
                    </p>

                    <div className="space-y-3">
                        {(Object.keys(SECTION_LABELS) as Array<keyof DashboardPreferences['visibleSections']>).map((key) => (
                            <div
                                key={key}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                            >
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {SECTION_LABELS[key]}
                                </span>
                                <button
                                    onClick={() => onToggleSection(key)}
                                    className={`p-2 rounded-lg transition-all ${preferences.visibleSections[key]
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    {preferences.visibleSections[key] ? (
                                        <Eye className="w-4 h-4" />
                                    ) : (
                                        <EyeOff className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
