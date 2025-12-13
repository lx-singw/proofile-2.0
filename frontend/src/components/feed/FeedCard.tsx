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
    TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type FeedItemType = "profile_update" | "job_match" | "skill_verified" | "resume_shared" | "milestone";

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
    const getTypeIcon = () => {
        switch (item.type) {
            case "job_match":
                return <Briefcase className="w-4 h-4 text-blue-500" />;
            case "skill_verified":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "resume_shared":
                return <FileText className="w-4 h-4 text-purple-500" />;
            case "milestone":
                return <Award className="w-4 h-4 text-yellow-500" />;
            default:
                return <TrendingUp className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeLabel = () => {
        switch (item.type) {
            case "job_match": return "Job Match";
            case "skill_verified": return "Skill Verified";
            case "resume_shared": return "Shared Resume";
            case "milestone": return "Milestone";
            default: return "Update";
        }
    };

    return (
        <article className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
                                className="rounded-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {item.user.name.charAt(0)}
                            </div>
                        )}
                    </Link>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Link href={`/p/${item.user.username || item.user.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
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

                    <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="mt-4">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLike?.(item.id)}
                        className={`flex items-center gap-1.5 rounded-lg ${item.isLiked ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                        <ThumbsUp className={`w-4 h-4 ${item.isLiked ? "fill-current" : ""}`} />
                        <span className="text-sm font-medium">{item.likes || ""}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComment?.(item.id)}
                        className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 rounded-lg"
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
