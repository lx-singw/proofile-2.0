'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, FileText, Upload, Sparkles, ArrowRight, Download, RefreshCw } from 'lucide-react';

interface ResumeToolsMenuProps {
    className?: string;
}

export default function ResumeToolsMenu({ className = '' }: ResumeToolsMenuProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const quickActions = [
        {
            icon: RefreshCw,
            label: 'Generate from profile',
            description: 'Create resume from your Proofile data',
            href: '/resume/build',
        },
        {
            icon: Download,
            label: 'Download existing resume',
            description: 'Export your saved resumes',
            href: '/resume',
        },
        {
            icon: FileText,
            label: 'Create new version',
            description: 'Build a new resume from scratch',
            href: '/resume/build',
        },
    ];

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Resume Tools</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Build, upload & manage resumes</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-sm">{isExpanded ? 'Collapse' : 'Expand'}</span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Actions:</p>

                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            href={action.href}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                        >
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <action.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {action.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}

                    <Link
                        href="/tools"
                        className="flex items-center justify-center gap-2 w-full py-3 mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                    >
                        View All Tools
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
