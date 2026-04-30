"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ThumbsUp,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Briefcase,
    Award,
    FileText,
    CheckCircle,
    TrendingUp,
    Star,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentActionBar, AgentAction } from "./agents/AgentActionBar";
import { DraftMessageModal } from "./agents/DraftMessageModal";
import { feedService } from "@/services/feedService";
import { HunterAgent } from "@/agents/HunterAgent";
import { NetworkAgent } from "@/agents/NetworkAgent";
import useAuth from "@/hooks/useAuth";

export type FeedItemType = "text" | "milestone" | "job_share" | "job_match" | "poll" | "achievement" | "skill_verified" | "profile_update";

export interface FeedItem {
    id: string;
    type: FeedItemType;
    user: {
        id: number;
        name: string;
        avatar_url?: string;
        headline?: string;
        username?: string;
    };
    content: string;
    metadata?: Record<string, any>;
    likes: number;
    comments: number;
    created_at: string;
    isLiked?: boolean;
}

interface FeedCardProps {
    item: FeedItem;
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
}

export function FeedCard({ item, onLike, onComment, onShare }: FeedCardProps) {
    const { user } = useAuth();
    const [isAgentProcessing, setIsAgentProcessing] = React.useState(false);

    // Calculate Agent Insights
    const agentInsights = React.useMemo(() => {
        if (!user) return null;

        // Fallback skills if user has none for demo purposes
        const userSkills = (user as any).skills || ["React", "TypeScript", "Communication", "Leadership", "Python"];

        if (item.type === "job_share") {
            return HunterAgent.calculateMatch(item.content, userSkills);
        }

        if (item.type === "milestone" || item.type === "profile_update") {
            const context = NetworkAgent.getConnectionContext(user.industry || "Tech", (item.user as any).industry || "Tech");
            return {
                score: 0,
                reasoning: context
            };
        }

        return null;
    }, [user, item]);

    const displayMatchScore = item.metadata?.match_score || agentInsights?.score;
    const displayMatchReason = item.metadata?.match_reason || agentInsights?.reasoning;

    const [agentDraft, setAgentDraft] = React.useState<string | null>(null);
    const [showDraftModal, setShowDraftModal] = React.useState(false);
    const [draftType, setDraftType] = React.useState<"congratulations" | "introduction" | "follow_up" | "thank_you">("congratulations");

    const handleAgentAction = async (action: AgentAction) => {
        if (action === "draft_cover" || action === "draft_message") {
            try {
                setIsAgentProcessing(true);
                const result = await feedService.executeAgentAction(
                    parseInt(item.id),
                    action === "draft_cover" ? "draft_cover" : "draft_message"
                );
                setAgentDraft(result.draft);
                setDraftType(action === "draft_cover" ? "introduction" : "congratulations");
                setShowDraftModal(true);
            } catch (error) {
                console.error("Agent action failed:", error);
            } finally {
                setIsAgentProcessing(false);
            }
        } else {
            // Handle other actions like quick apply or research
        }
    };
    const getTypeIcon = () => {
        switch (item.type) {
            case "milestone":
                return <Award className="w-4 h-4 text-emerald-500" />;
            case "skill_verified":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "text":
                return <FileText className="w-4 h-4 text-emerald-500" />;
            case "achievement":
                return <Star className="w-4 h-4 text-amber-500" />;
            case "job_share":
                return <Briefcase className="w-4 h-4 text-emerald-500" />;
            default:
                return <TrendingUp className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeLabel = () => {
        const isTraining = item.metadata?.opportunity_category === "training_skills_programs";
        switch (item.type) {
            case "milestone": return "Milestone";
            case "skill_verified": return "Skill Verified";
            case "text": return "Update";
            case "achievement": return "Achievement";
            case "job_share": return isTraining ? "Training Opportunity" : "Job Opportunity";
            case "profile_update": return "Profile Update";
            default: return "Update";
        }
    };

    const isMilestone = item.type === "milestone";

    return (
        <article className={`bg-white dark:bg-gray-800 rounded-2xl border ${isMilestone ? 'border-emerald-500/30' : 'border-gray-100 dark:border-gray-700'} shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group`}>
            {isMilestone && (
                <div className="absolute top-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                        <Award className="w-3 h-3" />
                        Verified Milestone
                    </div>
                </div>
            )}

            {item.type === "job_share" && user && (item.metadata?.opportunity_category === (user as any).opportunity_preference) && (
                <div className="absolute top-0 right-0 p-3 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800/20 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        Recommended for your path
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <Link href={`/p/${item.user.username || item.user.id}`} className="flex-shrink-0">
                        {item.user.avatar_url ? (
                            <Image
                                src={item.user.avatar_url}
                                alt={item.user.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-500/20 transition-all"
                                unoptimized
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                {item.user.name?.charAt(0) ?? '?'}
                            </div>
                        )}
                    </Link>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Link href={`/p/${item.user.username || item.user.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate">
                                {item.user.name}
                            </Link>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                {getTypeIcon()}
                                {getTypeLabel()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {item.user.headline || "Proofile User"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                    </div>

                    <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="More options">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="mt-4">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                    </p>
                </div>

                {/* Agent Action Bar (Conditional) */}
                {(item.type === "job_share" || item.type === "milestone" || item.type === "achievement" || item.type === "skill_verified") && (
                    <div className="mt-4">
                        <AgentActionBar
                            postType={item.type === "job_share" ? "job_match" : "milestone"}
                            matchScore={displayMatchScore}
                            matchReason={displayMatchReason}
                            onAction={handleAgentAction}
                            isProcessing={isAgentProcessing}
                        />
                    </div>
                )}
            </div>

            {/* Draft Modal */}
            <DraftMessageModal
                isOpen={showDraftModal}
                onClose={() => setShowDraftModal(false)}
                recipientName={item.user.name}
                contextType={draftType}
                contextDetails={item.type === "job_share" ? `Applying for ${item.metadata?.job_title}` : `Congratulating on ${item.type}`}
                initialDraft={agentDraft || undefined}
                onSend={async (msg) => {
                    // In real app, this would call a message service
                }}
            />

            {/* Actions */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLike?.(item.id)}
                        className={`flex items-center gap-1.5 rounded-lg ${item.isLiked ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}
                        aria-label={item.isLiked ? "Unlike post" : "Like post"}
                    >
                        <ThumbsUp className={`w-4 h-4 ${item.isLiked ? "fill-current" : ""}`} />
                        <span className="text-sm font-medium">{item.likes || ""}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComment?.(item.id)}
                        className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 rounded-lg"
                        aria-label="Comment on post"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.comments || ""}</span>
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShare?.(item.id)}
                    className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 rounded-lg"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">Share</span>
                </Button>
            </div>
        </article>
    );
}
