"use client";

import React, { useState, useCallback } from "react";
import {
    Star,
    Eye,
    UserPlus,
    ThumbsUp,
    MessageCircle,
    Coffee,
    Mail,
    Bookmark,
    BookmarkCheck,
    UserCheck,
    Check,
    Loader2
} from "lucide-react";
import * as socialService from "@/services/socialService";
import { useAuth } from "@/hooks/useAuth";

interface SocialActionButtonProps {
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    label: string;
    activeLabel?: string;
    onClick?: () => void;
    isActive?: boolean;
    variant?: "default" | "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    disabled?: boolean;
    loading?: boolean;
    count?: number;
}

export function SocialActionButton({
    icon,
    activeIcon,
    label,
    activeLabel,
    onClick,
    isActive = false,
    variant = "default",
    size = "md",
    showLabel = true,
    disabled = false,
    loading = false,
    count
}: SocialActionButtonProps) {
    const sizeClasses = {
        sm: "px-2 py-1 text-xs gap-1",
        md: "px-3 py-2 text-sm gap-2",
        lg: "px-4 py-3 text-base gap-2"
    };

    const variantClasses = {
        default: isActive
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600",
        primary: isActive
            ? "bg-green-600 text-white border-green-600"
            : "bg-green-600 text-white border-green-600 hover:bg-green-700",
        secondary: isActive
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-700"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                inline-flex items-center justify-center rounded-lg border font-medium transition-all
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                isActive && activeIcon ? activeIcon : icon
            )}
            {showLabel && !loading && (
                <span>{isActive && activeLabel ? activeLabel : label}</span>
            )}
            {count !== undefined && !loading && (
                <span className="ml-1 text-xs opacity-75">({count})</span>
            )}
        </button>
    );
}

// Pre-configured social action buttons with real API integration
interface StarProfileButtonProps {
    userId: number;
    isStarred?: boolean;
    starCount?: number;
    onToggle?: (starred: boolean) => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function StarProfileButton({ userId, isStarred = false, starCount, onToggle, onAuthRequired, size = "md", showLabel = true }: StarProfileButtonProps) {
    const { isAuthenticated } = useAuth();
    const [starred, setStarred] = useState(isStarred);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(starCount);

    const handleClick = useCallback(async () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setLoading(true);
        try {
            if (starred) {
                await socialService.unstarProfile(userId);
                setStarred(false);
                setCount(prev => prev !== undefined ? Math.max(0, prev - 1) : undefined);
                toast.success("Removed from starred");
            } else {
                await socialService.starProfile(userId);
                setStarred(true);
                setCount(prev => prev !== undefined ? prev + 1 : undefined);
                toast.success("Profile starred!");
            }
            onToggle?.(!starred);
        } catch (error) {
            toast.error("Failed to update star status");
        } finally {
            setLoading(false);
        }
    }, [userId, starred, onToggle]);

    return (
        <SocialActionButton
            icon={<Bookmark className="w-4 h-4" />}
            activeIcon={<BookmarkCheck className="w-4 h-4" />}
            label="Star"
            activeLabel="Starred"
            isActive={starred}
            onClick={handleClick}
            size={size}
            showLabel={showLabel}
            loading={loading}
            count={count}
        />
    );
}

interface WatchProfileButtonProps {
    userId: number;
    isWatching?: boolean;
    onToggle?: (watching: boolean) => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function WatchProfileButton({ userId, isWatching = false, onToggle, onAuthRequired, size = "md", showLabel = true }: WatchProfileButtonProps) {
    const { isAuthenticated } = useAuth();
    const [watching, setWatching] = useState(isWatching);
    const [loading, setLoading] = useState(false);

    const handleClick = useCallback(async () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setLoading(true);
        try {
            if (watching) {
                await socialService.unwatchProfile(userId);
                setWatching(false);
                toast.success("Stopped watching");
            } else {
                await socialService.watchProfile(userId);
                setWatching(true);
                toast.success("Now watching profile updates");
            }
            onToggle?.(!watching);
        } catch (error) {
            toast.error("Failed to update watch status");
        } finally {
            setLoading(false);
        }
    }, [userId, watching, onToggle]);

    return (
        <SocialActionButton
            icon={<Eye className="w-4 h-4" />}
            label="Watch"
            activeLabel="Watching"
            isActive={watching}
            onClick={handleClick}
            size={size}
            showLabel={showLabel}
            loading={loading}
        />
    );
}

interface FollowButtonProps {
    userId: number;
    isFollowing?: boolean;
    followerCount?: number;
    onToggle?: (following: boolean) => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function FollowButton({ userId, isFollowing = false, followerCount, onToggle, onAuthRequired, size = "md", showLabel = true }: FollowButtonProps) {
    const { isAuthenticated } = useAuth();
    const [following, setFollowing] = useState(isFollowing);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(followerCount);

    const handleClick = useCallback(async () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setLoading(true);
        try {
            if (following) {
                await socialService.unfollowUser(userId);
                setFollowing(false);
                setCount(prev => prev !== undefined ? Math.max(0, prev - 1) : undefined);
                toast.success("Unfollowed");
            } else {
                await socialService.followUser(userId);
                setFollowing(true);
                setCount(prev => prev !== undefined ? prev + 1 : undefined);
                toast.success("Now following!");
            }
            onToggle?.(!following);
        } catch (error) {
            toast.error("Failed to update follow status");
        } finally {
            setLoading(false);
        }
    }, [userId, following, onToggle]);

    return (
        <SocialActionButton
            icon={<UserPlus className="w-4 h-4" />}
            activeIcon={<UserCheck className="w-4 h-4" />}
            label="Follow"
            activeLabel="Following"
            isActive={following}
            onClick={handleClick}
            variant={following ? "default" : "primary"}
            size={size}
            showLabel={showLabel}
            loading={loading}
            count={count}
        />
    );
}

interface EndorseSkillButtonProps {
    userId: number;
    skillName: string;
    isEndorsed?: boolean;
    endorsementCount?: number;
    onToggle?: (endorsed: boolean) => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
}

export function EndorseSkillButton({ userId, skillName, isEndorsed = false, endorsementCount, onToggle, onAuthRequired, size = "sm" }: EndorseSkillButtonProps) {
    const { isAuthenticated } = useAuth();
    const [endorsed, setEndorsed] = useState(isEndorsed);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(endorsementCount);

    const handleClick = useCallback(async () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        setLoading(true);
        try {
            if (endorsed) {
                // Note: We don't have the endorsement ID here, so we can't easily remove
                // For now, just show a message
                toast.info("To remove endorsement, go to your endorsements page");
            } else {
                await socialService.endorseSkill(userId, skillName);
                setEndorsed(true);
                setCount(prev => prev !== undefined ? prev + 1 : undefined);
                toast.success(`Endorsed ${skillName}!`);
            }
            onToggle?.(!endorsed);
        } catch (error: unknown) {
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 409) {
                setEndorsed(true);
                toast.info("Already endorsed this skill");
            } else {
                toast.error("Failed to endorse skill");
            }
        } finally {
            setLoading(false);
        }
    }, [userId, skillName, endorsed, onToggle]);

    return (
        <SocialActionButton
            icon={<ThumbsUp className="w-3 h-3" />}
            activeIcon={<ThumbsUp className="w-3 h-3 fill-current" />}
            label={`+1`}
            activeLabel="Endorsed"
            isActive={endorsed}
            onClick={handleClick}
            size={size}
            showLabel={true}
            loading={loading}
            count={count}
        />
    );
}

interface ConnectButtonProps {
    userId: number;
    connectionStatus?: "none" | "pending" | "connected";
    onConnect?: () => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function ConnectButton({ userId, connectionStatus = "none", onConnect, onAuthRequired, size = "md", showLabel = true }: ConnectButtonProps) {
    const { isAuthenticated } = useAuth();
    const [status, setStatus] = useState(connectionStatus);
    const [loading, setLoading] = useState(false);

    const handleClick = useCallback(async () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        if (status === "none") {
            setLoading(true);
            try {
                await socialService.requestConnection(userId);
                setStatus("pending");
                onConnect?.();
                toast.success("Connection request sent!");
            } catch (error: unknown) {
                const err = error as { response?: { status?: number } };
                if (err.response?.status === 409) {
                    toast.info("Connection request already exists");
                    setStatus("pending");
                } else {
                    toast.error("Failed to send connection request");
                }
            } finally {
                setLoading(false);
            }
        }
    }, [userId, status, onConnect]);

    const getButtonState = () => {
        switch (status) {
            case "connected":
                return { icon: <Check className="w-4 h-4" />, label: "Connected", isActive: true, disabled: true };
            case "pending":
                return { icon: <UserPlus className="w-4 h-4" />, label: "Pending", isActive: false, disabled: true };
            default:
                return { icon: <UserPlus className="w-4 h-4" />, label: "Connect", isActive: false, disabled: false };
        }
    };

    const buttonState = getButtonState();

    return (
        <SocialActionButton
            icon={buttonState.icon}
            label={buttonState.label}
            isActive={buttonState.isActive}
            onClick={handleClick}
            variant="secondary"
            size={size}
            showLabel={showLabel}
            disabled={buttonState.disabled}
        />
    );
}

interface CoffeeChatButtonProps {
    onClick?: () => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function CoffeeChatButton({ onClick, onAuthRequired, size = "md", showLabel = true }: CoffeeChatButtonProps) {
    const { isAuthenticated } = useAuth();
    const handleClick = () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        onClick?.();
        toast.success("Coffee chat request sent!");
    };

    return (
        <SocialActionButton
            icon={<Coffee className="w-4 h-4" />}
            label="Coffee Chat"
            onClick={handleClick}
            variant="secondary"
            size={size}
            showLabel={showLabel}
        />
    );
}

interface SendMessageButtonProps {
    onClick?: () => void;
    onAuthRequired?: () => void;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function SendMessageButton({ onClick, onAuthRequired, size = "md", showLabel = true }: SendMessageButtonProps) {
    const { isAuthenticated } = useAuth();
    const handleClick = () => {
        if (!isAuthenticated) {
            onAuthRequired?.();
            return;
        }
        onClick?.();
        // This would typically open a message modal
    };

    return (
        <SocialActionButton
            icon={<Mail className="w-4 h-4" />}
            label="Message"
            onClick={handleClick}
            variant="secondary"
            size={size}
            showLabel={showLabel}
        />
    );
}

// Profile Stats Display Component
interface ProfileStatsProps {
    profileViews: number;
    searchAppearances: number;
    engagementRate: number;
    followerCount: number;
    starCount: number;
    className?: string;
}

export function ProfileStats({
    profileViews,
    searchAppearances,
    engagementRate,
    followerCount,
    starCount,
    className = ""
}: ProfileStatsProps) {
    const stats = [
        { label: "Profile Views", value: profileViews.toLocaleString(), icon: <Eye className="w-4 h-4" /> },
        { label: "Search Appearances", value: searchAppearances.toLocaleString(), icon: <Eye className="w-4 h-4" /> },
        { label: "Engagement", value: `${engagementRate}%`, icon: <ThumbsUp className="w-4 h-4" /> },
        { label: "Followers", value: followerCount.toLocaleString(), icon: <UserPlus className="w-4 h-4" /> },
        { label: "Stars", value: starCount.toLocaleString(), icon: <Star className="w-4 h-4" /> },
    ];

    return (
        <div className={`grid grid-cols-5 gap-4 ${className}`}>
            {stats.map((stat) => (
                <div key={stat.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                        {stat.icon}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

// Compact stats for smaller spaces
export function ProfileStatsCompact({
    profileViews,
    followerCount,
    starCount,
    className = ""
}: Pick<ProfileStatsProps, 'profileViews' | 'followerCount' | 'starCount' | 'className'>) {
    return (
        <div className={`flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
            <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{profileViews.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1">
                <UserPlus className="w-4 h-4" />
                <span>{followerCount.toLocaleString()} followers</span>
            </div>
            <div className="flex items-center gap-1">
                <Bookmark className="w-4 h-4" />
                <span>{starCount.toLocaleString()} stars</span>
            </div>
        </div>
    );
}
