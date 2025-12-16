"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon,
    FileText,
    Briefcase,
    BarChart3,
    Gift,
    Smile,
    X,
    Send,
    Globe,
    Lock,
    Users
} from "lucide-react";

export type PostType = "text" | "milestone" | "job_share" | "poll" | "achievement";
export type PostVisibility = "public" | "connections" | "private";

interface CreatePostComposerProps {
    onPost?: (content: string, type: PostType, visibility: PostVisibility) => void;
    placeholder?: string;
    userName?: string;
    userAvatar?: string;
}

const POST_TYPE_OPTIONS = [
    { type: "text" as PostType, icon: FileText, label: "Post", color: "text-gray-600" },
    { type: "milestone" as PostType, icon: Gift, label: "Milestone", color: "text-emerald-600" },
    { type: "job_share" as PostType, icon: Briefcase, label: "Share Job", color: "text-emerald-600" },
    { type: "poll" as PostType, icon: BarChart3, label: "Poll", color: "text-emerald-600" },
];

const VISIBILITY_OPTIONS = [
    { value: "public" as PostVisibility, icon: Globe, label: "Public" },
    { value: "connections" as PostVisibility, icon: Users, label: "Connections" },
    { value: "private" as PostVisibility, icon: Lock, label: "Private" },
];

export function CreatePostComposer({
    onPost,
    placeholder = "What's happening in your career?",
    userName = "User",
    userAvatar,
}: CreatePostComposerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState<PostType>("text");
    const [visibility, setVisibility] = useState<PostVisibility>("public");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        setIsExpanded(true);
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setContent("");
        setPostType("text");
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await onPost?.(content, postType, visibility);
            setContent("");
            setIsExpanded(false);
            setPostType("text");
        } catch (error) {
            console.error("Failed to post:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-200">
            <div className="p-4">
                {/* Top Row - Avatar + Input */}
                <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {userAvatar ? (
                            <img
                                src={userAvatar}
                                alt={userName}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="flex-1 min-w-0">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleTextareaChange}
                            onFocus={handleFocus}
                            placeholder={placeholder}
                            rows={isExpanded ? 3 : 1}
                            className="w-full resize-none bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                            style={{ minHeight: isExpanded ? "80px" : "44px" }}
                        />

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Post Type Selector */}
                                <div className="flex flex-wrap gap-2">
                                    {POST_TYPE_OPTIONS.map(option => (
                                        <button
                                            key={option.type}
                                            onClick={() => setPostType(option.type)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                                ${postType === option.type
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                        >
                                            <option.icon className={`w-4 h-4 ${option.color}`} />
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Visibility Selector */}
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Visible to:</span>
                                    <div className="flex gap-2">
                                        {VISIBILITY_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setVisibility(option.value)}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all
                                                    ${visibility === option.value
                                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                                    }`}
                                            >
                                                <option.icon className="w-3 h-3" />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className={`border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-all ${isExpanded ? "" : "opacity-70"}`}>
                {/* Media Actions */}
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg"
                        disabled={!isExpanded}
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg"
                        disabled={!isExpanded}
                    >
                        <Smile className="w-5 h-5" />
                    </Button>
                </div>

                {/* Submit Actions */}
                {isExpanded && (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-500 dark:text-gray-400 rounded-lg"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-lg px-4"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Posting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Send className="w-4 h-4" />
                                    Post
                                </span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
