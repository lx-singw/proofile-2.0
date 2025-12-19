"use client";

import React, { useState, useEffect, useCallback } from "react";
import { feedService, PostResponse } from "@/services/feedService";
import { FeedCard, FeedItem } from "@/components/feed/FeedCard";
import { Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { FeedSkeletonList } from "@/components/ui/FeedSkeleton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface FeedListProps {
    initialPosts?: PostResponse[];
    userId?: number;
    followingOnly?: boolean;
}

export function FeedList({ initialPosts = [], userId, followingOnly = false }: FeedListProps) {
    const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = useCallback(async (pageNum: number) => {
        if (loading || (!hasMore && pageNum > 1)) return;

        setLoading(true);
        try {
            const response = await feedService.getFeed({
                page: pageNum,
                size: 10,
                following_only: followingOnly
            });

            if (pageNum === 1) {
                setPosts(response.posts);
            } else {
                setPosts(prev => [...prev, ...response.posts]);
            }

            setHasMore(response.has_more);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch feed:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, followingOnly]);

    useEffect(() => {
        if (posts.length === 0) {
            fetchPosts(1);
        }
    }, []);

    // Map PostResponse to FeedItem for compatibility with FeedCard
    const mapToFeedItem = (post: PostResponse): FeedItem => ({
        id: post.id.toString(),
        type: post.type as any, // Need to reconcile types if they differ slightly
        user: {
            id: post.user.id,
            name: post.user.full_name || post.user.username || "Anonymous",
            avatar_url: post.user.profile_photo_url,
            headline: post.user.headline,
            username: post.user.username
        },
        content: post.content,
        likes: post.likes_count,
        comments: post.comments_count,
        created_at: post.created_at,
        isLiked: !!post.user_reaction,
        metadata: post.metadata
    });

    const handleLike = async (postId: string) => {
        try {
            await feedService.toggleReaction(parseInt(postId), "like");
            setPosts(prev => prev.map(p => {
                if (p.id.toString() === postId) {
                    const isCurrentlyLiked = !!p.user_reaction;
                    return {
                        ...p,
                        likes_count: isCurrentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
                        user_reaction: isCurrentlyLiked ? undefined : "like"
                    };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to toggle reaction:", error);
        }
    };

    const refreshFeed = async () => {
        await fetchPosts(1);
    };

    const { contentRef, pullHeight, loading: refreshing } = usePullToRefresh({
        onRefresh: refreshFeed
    });

    return (
        <div ref={contentRef} className="space-y-4 relative" style={{ minHeight: '50vh' }}>
            {/* Pull to Refresh Indicator */}
            <div
                className="fixed left-0 right-0 flex justify-center pointer-events-none z-10 transition-all duration-300"
                style={{
                    top: `calc(4rem + ${pullHeight > 0 ? pullHeight - 40 : -100}px)`,
                    opacity: pullHeight > 0 ? 1 : 0
                }}
            >
                <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-100 dark:border-gray-700">
                    <RefreshCw className={`w-5 h-5 text-emerald-600 ${refreshing ? "animate-spin" : ""} ${pullHeight > 50 ? "rotate-180 transition-transform" : ""}`} />
                </div>
            </div>

            <div
                className="space-y-4 transition-transform duration-200"
            // style={{ transform: `translateY(${Math.max(0, pullHeight - 20) / 2}px)` }} 
            >
                {posts.length === 0 && loading ? (
                    <FeedSkeletonList />
                ) : posts.length === 0 && !loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your feed is quiet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                            Follow professionals in your industry to see their milestones and updates here.
                        </p>
                        <button
                            onClick={() => fetchPosts(1)}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Refresh Feed
                        </button>
                    </div>
                ) : (
                    <>
                        {posts.map(post => (
                            <FeedCard
                                key={post.id}
                                item={mapToFeedItem(post)}
                                onLike={handleLike}
                            />
                        ))}

                        {hasMore && (
                            <div className="flex justify-center py-6">
                                <button
                                    onClick={() => fetchPosts(page + 1)}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Load More
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
