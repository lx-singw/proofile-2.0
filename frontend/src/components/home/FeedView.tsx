"use client";

import React, { useState } from "react";
import { CreatePostComposer, PostType, PostVisibility } from "@/components/feed/CreatePostComposer";
import { FeedList } from "@/components/feed/FeedList";
import { feedService } from "@/services/feedService";
import useAuth from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import { TrendingUp, Users } from "lucide-react";
import { PersonalizationBanner } from "./PersonalizationBanner";
import { StoriesBar } from "@/components/feed/StoriesBar";

type FeedFilter = "all" | "following";

export function FeedView() {
    const { user } = useAuth();
    const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
    const [refreshKey, setRefreshKey] = useState(0);

    const handlePost = async (content: string, type: PostType, visibility: PostVisibility) => {
        try {
            await feedService.createPost({
                content,
                type,
                visibility
            });
            toast.success("Post published!");
            // Trigger a refresh of the feed list
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Failed to create post:", error);
            toast.error("Failed to publish post. Please try again.");
            throw error;
        }
    };

    return (
        <div className="space-y-4">
            {/* Create Post Composer */}
            <CreatePostComposer
                onPost={handlePost}
                userName={user?.full_name || user?.username || "You"}
                userAvatar={user?.profile_photo_url}
                placeholder="Share a milestone, insight, or just say hello..."
            />

            {/* Professional Stories */}
            <StoriesBar />

            {/* Personalization Banner */}
            <PersonalizationBanner />

            {/* Feed Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <button
                    onClick={() => setFeedFilter("all")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${feedFilter === "all"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    {user?.opportunity_preference === 'jobs' ? 'Job Match' :
                        user?.opportunity_preference === 'training_skills_programs' ? 'Training Path' :
                            'All Updates'}
                </button>
                <button
                    onClick={() => setFeedFilter("following")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${feedFilter === "following"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Following
                </button>
            </div>

            {/* Feed List */}
            <FeedList
                key={`${feedFilter}-${refreshKey}`}
                followingOnly={feedFilter === "following"}
            />
        </div>
    );
}
