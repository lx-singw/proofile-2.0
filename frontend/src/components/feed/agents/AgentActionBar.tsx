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
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    },
    {
        type: "tailor_resume",
        icon: <Sparkles className="w-4 h-4" />,
        label: "Tailor Resume",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
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
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
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
        <div className="bg-gradient-to-r from-emerald-50/50 to-emerald-50/50 dark:from-emerald-900/10 dark:to-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 p-3">
            {/* Agent Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center">
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
                                matchScore >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                                    "text-emerald-600 dark:text-emerald-400"
                            }`}>
                            {matchScore}%
                        </span>
                    </div>
                )}
            </div>

            {/* Match Reason */}
            {matchReason && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
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
