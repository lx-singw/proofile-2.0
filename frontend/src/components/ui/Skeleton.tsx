"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "shimmer" | "none";
}

/**
 * Skeleton - Loading placeholder component
 * 
 * Features:
 * - Multiple variants (text, circular, rectangular, rounded)
 * - Shimmer or pulse animation
 * - Dark mode support
 */
export function Skeleton({
    className = "",
    variant = "rectangular",
    width,
    height,
    animation = "shimmer",
}: SkeletonProps) {
    const baseStyles = "bg-gray-200 dark:bg-gray-700";

    const variantStyles = {
        text: "rounded h-4 w-full",
        circular: "rounded-full",
        rectangular: "",
        rounded: "rounded-lg",
    };

    const animationStyles = {
        pulse: "animate-pulse",
        shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        none: "",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={cn(
                baseStyles,
                variantStyles[variant],
                animationStyles[animation],
                className
            )}
            style={style}
            aria-hidden="true"
        />
    );
}

// Pre-built skeleton layouts
export function CardSkeleton({ className = "" }: { className?: string }) {
    return (
        <div className={cn("bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6", className)}>
            <div className="flex items-start gap-4">
                <Skeleton variant="rounded" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <Skeleton variant="text" height={14} />
                <Skeleton variant="text" height={14} />
                <Skeleton variant="text" width="75%" height={14} />
            </div>
        </div>
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="50%" height={16} />
                <Skeleton variant="text" width="30%" height={12} />
            </div>
            <Skeleton variant="rounded" width={80} height={32} />
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="text" width={200} height={28} />
                </div>
                <Skeleton variant="text" width={300} height={16} />
            </div>
            <div className="flex gap-3">
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={120} height={40} />
            </div>
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <Skeleton variant="text" width="40%" height={12} className="mb-2" />
                    <Skeleton variant="text" width="60%" height={24} />
                </div>
            ))}
        </div>
    );
}

export function JobCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <Skeleton variant="rounded" width={48} height={48} />
                    <div className="space-y-2">
                        <Skeleton variant="text" width={180} height={18} />
                        <Skeleton variant="text" width={120} height={14} />
                    </div>
                </div>
                <Skeleton variant="rounded" width={60} height={28} />
            </div>
            <div className="flex gap-2 mb-4">
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={100} height={24} />
                <Skeleton variant="rounded" width={70} height={24} />
            </div>
            <div className="flex justify-between items-center">
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="rounded" width={100} height={36} />
            </div>
        </div>
    );
}

export default Skeleton;
