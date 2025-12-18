"use client";

import React from "react";

export function FeedSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-4 sm:p-5 relative animate-pulse" aria-hidden="true">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                {/* Avatar Skeleton */}
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

                {/* User Info Skeleton */}
                <div className="flex-1 space-y-2 mt-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-3 mb-4">
                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full" />
                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full" />
                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-3/4" />
            </div>

            {/* Actions Skeleton */}
            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-4">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-12" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-12" />
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-12" />
            </div>
        </div>
    );
}

export function FeedSkeletonList() {
    return (
        <div className="space-y-4">
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
        </div>
    );
}
