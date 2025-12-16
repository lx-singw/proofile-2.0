'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Key, FileCheck, Wand2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExpandablePanelProps {
    title: string;
    score: number;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export function ExpandablePanel({ title, score, icon, children, defaultExpanded = false }: ExpandablePanelProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-emerald-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        {icon}
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                        <p className={`text-sm font-semibold ${getScoreColor(score)}`}>{score}/100</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {children}
                </div>
            )}
        </div>
    );
}

interface InsightItemProps {
    type: 'success' | 'warning' | 'error';
    text: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function InsightItem({ type, text, action }: InsightItemProps) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-emerald-600" />;
            case 'error':
                return <AlertTriangle className="w-5 h-5 text-red-600" />;
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-gray-700 dark:text-gray-300';
            case 'warning':
                return 'text-gray-700 dark:text-gray-300';
            case 'error':
                return 'text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="flex items-start justify-between gap-3 py-2">
            <div className="flex items-start gap-2 flex-1">
                {getIcon()}
                <p className={getTextColor()}>{text}</p>
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="text-sm text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

interface AIRefinementToolsProps {
    onToolSelect: (tool: string) => void;
}

export function AIRefinementTools({ onToolSelect }: AIRefinementToolsProps) {
    const tools = [
        {
            id: 'enhance-writing',
            icon: <Sparkles className="w-6 h-6 text-white" />,
            title: 'Enhance Writing Quality',
            description: 'Transform weak bullet points into impactful achievements',
            color: 'from-emerald-500 to-pink-600'
        },
        {
            id: 'optimize-keywords',
            icon: <Key className="w-6 h-6 text-white" />,
            title: 'Optimize Keywords',
            description: 'Add missing industry-specific keywords automatically',
            color: 'from-emerald-500 to-emerald-600'
        },
        {
            id: 'fix-ats',
            icon: <FileCheck className="w-6 h-6 text-white" />,
            title: 'Improve ATS Compatibility',
            description: 'Fix formatting issues that block ATS systems',
            color: 'from-green-500 to-emerald-600'
        },
        {
            id: 'full-makeover',
            icon: <Wand2 className="w-6 h-6 text-white" />,
            title: 'Full AI Makeover',
            description: 'Let AI optimize everything at once (recommended)',
            color: 'from-emerald-500 to-red-600'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-green-600" />
                AI Refinement Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose what you'd like to improve with AI assistance
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onToolSelect(tool.id)}
                        className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg text-left"
                    >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            {tool.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{tool.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
