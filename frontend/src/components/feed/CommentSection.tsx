"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    MessageCircle,
    ThumbsUp,
    Send,
    Shield
} from "lucide-react";

export interface Comment {
    id: string;
    user: {
        id: string | number;
        name: string;
        username?: string;
        avatarUrl?: string;
        headline?: string;
        isVerified?: boolean;
    };
    content: string;
    createdAt: string;
    likes: number;
    isLiked?: boolean;
    replies?: Comment[];
}

interface CommentSectionProps {
    postId: string;
    comments: Comment[];
    onAddComment?: (postId: string, content: string, parentId?: string) => Promise<void>;
    onLikeComment?: (commentId: string) => void;
    maxVisible?: number;
    currentUser?: {
        name: string;
        avatarUrl?: string;
    };
}

export function CommentSection({
    postId,
    comments,
    onAddComment,
    onLikeComment,
    maxVisible = 3,
    currentUser,
}: CommentSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const visibleComments = isExpanded ? comments : comments.slice(0, maxVisible);
    const hasMore = comments.length > maxVisible && !isExpanded;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !onAddComment) return;

        setIsSubmitting(true);
        try {
            await onAddComment(postId, newComment, replyingTo || undefined);
            setNewComment("");
            setReplyingTo(null);
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border-t border-gray-100 dark:border-gray-700">
            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="p-4 flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {currentUser?.avatarUrl ? (
                        <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {currentUser?.name?.charAt(0) || "U"}
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-7 w-7 p-0"
                    >
                        <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                </div>
            </form>

            {/* Comments List */}
            {visibleComments.length > 0 && (
                <div className="px-4 pb-4 space-y-4">
                    {visibleComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onLike={onLikeComment}
                            onReply={() => setReplyingTo(comment.id)}
                        />
                    ))}

                    {/* Show More Button */}
                    {hasMore && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            View {comments.length - maxVisible} more comments
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Individual Comment Item
interface CommentItemProps {
    comment: Comment;
    onLike?: (commentId: string) => void;
    onReply?: () => void;
    isReply?: boolean;
}

function CommentItem({ comment, onLike, onReply, isReply }: CommentItemProps) {
    return (
        <div className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
            {/* Avatar */}
            <Link href={`/p/${comment.user.username || comment.user.id}`} className="flex-shrink-0">
                {comment.user.avatarUrl ? (
                    <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.name}
                        className={`rounded-full object-cover ${isReply ? "w-6 h-6" : "w-8 h-8"}`}
                    />
                ) : (
                    <div className={`rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold ${isReply ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}`}>
                        {comment.user.name.charAt(0)}
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/p/${comment.user.username || comment.user.id}`}
                            className="font-semibold text-sm text-gray-900 dark:text-white hover:underline"
                        >
                            {comment.user.name}
                        </Link>
                        {comment.user.isVerified && (
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        {comment.user.headline && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {comment.user.headline}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {comment.content}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1 px-2">
                    <button
                        onClick={() => onLike?.(comment.id)}
                        className={`text-xs font-medium transition-colors ${comment.isLiked
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        Like {comment.likes > 0 && `(${comment.likes})`}
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <button
                        onClick={onReply}
                        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Reply
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onLike={onLike}
                                isReply={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
