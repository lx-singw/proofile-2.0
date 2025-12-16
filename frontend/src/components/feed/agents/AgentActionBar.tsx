"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Bot,
    FileText,
    Send,
    Briefcase,
    Zap,
    Sparkles,
    ChevronRight,
    CheckCircle
} from "lucide-react";

export type AgentAction = "draft_cover" | "tailor_resume" | "quick_apply" | "draft_message" | "research_company";

interface AgentActionConfig {
    type: AgentAction;
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
}

const AGENT_ACTIONS: AgentActionConfig[] = [
    {
        type: "draft_cover",
        icon: <FileText className="w-4 h-4" />,
        label: "Draft Cover",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
    {
        type: "tailor_resume",
        icon: <Sparkles className="w-4 h-4" />,
        label: "Tailor Resume",
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    },
    {
        type: "quick_apply",
        icon: <Zap className="w-4 h-4" />,
        label: "Quick Apply",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
    },
];

const MESSAGE_ACTIONS: AgentActionConfig[] = [
    {
        type: "draft_message",
        icon: <Send className="w-4 h-4" />,
        label: "Draft Congrats",
        color: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30",
    },
];

interface AgentActionBarProps {
    postType: "job_match" | "verification" | "milestone" | "general";
    matchScore?: number;
    matchReason?: string;
    onAction: (action: AgentAction) => void;
    isProcessing?: boolean;
    compact?: boolean;
}

export function AgentActionBar({
    postType,
    matchScore,
    matchReason,
    onAction,
    isProcessing = false,
    compact = false,
}: AgentActionBarProps) {
    const [processingAction, setProcessingAction] = useState<AgentAction | null>(null);

    const actions = postType === "job_match" ? AGENT_ACTIONS : MESSAGE_ACTIONS;

    const handleAction = async (action: AgentAction) => {
        setProcessingAction(action);
        await onAction(action);
        setProcessingAction(null);
    };

    return (
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 p-3">
            {/* Agent Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Proofile Agent
                </span>
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Active
                </span>

                {/* Match Score */}
                {matchScore && (
                    <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Match:</span>
                        <span className={`text-sm font-bold ${matchScore >= 90 ? "text-green-600 dark:text-green-400" :
                                matchScore >= 70 ? "text-blue-600 dark:text-blue-400" :
                                    "text-orange-600 dark:text-orange-400"
                            }`}>
                            {matchScore}%
                        </span>
                    </div>
                )}
            </div>

            {/* Match Reason */}
            {matchReason && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {matchReason}
                </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                    <button
                        key={action.type}
                        onClick={() => handleAction(action.type)}
                        disabled={isProcessing || processingAction !== null}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                            ${action.bgColor} ${action.color}
                            ${processingAction === action.type ? "opacity-70" : ""}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {processingAction === action.type ? (
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            action.icon
                        )}
                        {!compact && action.label}
                    </button>
                ))}

                {/* Research Company - Only for job matches */}
                {postType === "job_match" && !compact && (
                    <button
                        onClick={() => handleAction("research_company")}
                        disabled={isProcessing || processingAction !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                            text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                            bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700
                            transition-all disabled:opacity-50"
                    >
                        <Briefcase className="w-4 h-4" />
                        Research
                    </button>
                )}
            </div>
        </div>
    );
}
