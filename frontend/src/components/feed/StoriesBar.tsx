"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Eye, Award, Briefcase, GraduationCap, X, ChevronLeft, ChevronRight } from "lucide-react";
import useAuth from "@/hooks/useAuth";

interface Story {
    id: string;
    user: {
        id: number;
        name: string;
        avatar_url?: string;
    };
    type: "milestone" | "profile_view" | "verification" | "job_match" | "anniversary";
    content: string;
    timestamp: string;
    viewed: boolean;
}

interface StoriesBarProps {
    stories?: Story[];
    onCreateStory?: () => void;
}

// Mock stories for demonstration
const MOCK_STORIES: Story[] = [
    {
        id: "1",
        user: { id: 1, name: "Sarah Chen", avatar_url: undefined },
        type: "verification",
        content: "Just earned Staff Engineer verification!",
        timestamp: "2h ago",
        viewed: false,
    },
    {
        id: "2",
        user: { id: 2, name: "Marcus Johnson", avatar_url: undefined },
        type: "job_match",
        content: "Found 5 new job matches today",
        timestamp: "4h ago",
        viewed: false,
    },
    {
        id: "3",
        user: { id: 3, name: "Emily Wang", avatar_url: undefined },
        type: "profile_view",
        content: "234 profile views this week!",
        timestamp: "6h ago",
        viewed: true,
    },
    {
        id: "4",
        user: { id: 4, name: "Alex Rodriguez", avatar_url: undefined },
        type: "milestone",
        content: "Celebrating 5 years at TechCorp",
        timestamp: "1d ago",
        viewed: true,
    },
    {
        id: "5",
        user: { id: 5, name: "Jordan Kim", avatar_url: undefined },
        type: "anniversary",
        content: "1 year on Proofile 🎉",
        timestamp: "1d ago",
        viewed: false,
    },
];

const getStoryIcon = (type: Story["type"]) => {
    switch (type) {
        case "verification": return <Award className="w-3 h-3 text-emerald-500" />;
        case "job_match": return <Briefcase className="w-3 h-3 text-blue-500" />;
        case "profile_view": return <Eye className="w-3 h-3 text-purple-500" />;
        case "milestone": return <GraduationCap className="w-3 h-3 text-amber-500" />;
        case "anniversary": return <Award className="w-3 h-3 text-rose-500" />;
        default: return null;
    }
};

export function StoriesBar({ stories = MOCK_STORIES, onCreateStory }: StoriesBarProps) {
    const { user } = useAuth();
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    if (!user) return null;

    return (
        <>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                {/* Scroll Buttons */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Stories Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {/* Create Story Button */}
                    <button
                        onClick={onCreateStory}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center group-hover:from-emerald-50 group-hover:to-emerald-100 dark:group-hover:from-emerald-900/30 dark:group-hover:to-emerald-800/30 transition-all">
                                {user.profile_photo_url ? (
                                    <Image
                                        src={user.profile_photo_url}
                                        alt={user.full_name || "You"}
                                        width={64}
                                        height={64}
                                        className="rounded-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors">
                                        {(user.full_name || user.username || "U").charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Your Story</span>
                    </button>

                    {/* Other Stories */}
                    {stories.map((story) => (
                        <button
                            key={story.id}
                            onClick={() => setSelectedStory(story)}
                            className="flex flex-col items-center gap-2 flex-shrink-0 group"
                        >
                            <div className={`relative p-0.5 rounded-full ${story.viewed
                                    ? "bg-gray-300 dark:bg-gray-600"
                                    : "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500"
                                }`}>
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    {story.user.avatar_url ? (
                                        <Image
                                            src={story.user.avatar_url}
                                            alt={story.user.name}
                                            width={60}
                                            height={60}
                                            className="rounded-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                                            {story.user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center ring-1 ring-gray-200 dark:ring-gray-700">
                                    {getStoryIcon(story.type)}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[64px]">
                                {story.user.name.split(" ")[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Story Viewer Modal */}
            {selectedStory && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <button
                        onClick={() => setSelectedStory(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Story Header */}
                        <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                {selectedStory.user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">{selectedStory.user.name}</h4>
                                <p className="text-xs text-gray-400">{selectedStory.timestamp}</p>
                            </div>
                            {getStoryIcon(selectedStory.type)}
                        </div>

                        {/* Story Content */}
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                                {React.cloneElement(getStoryIcon(selectedStory.type) as React.ReactElement, { className: "w-10 h-10" })}
                            </div>
                            <p className="text-xl font-medium text-white mb-2">{selectedStory.content}</p>
                            <p className="text-gray-400 text-sm">Tap to view details</p>
                        </div>

                        {/* Story Actions */}
                        <div className="p-4 border-t border-gray-700 flex gap-3">
                            <button className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
                                Celebrate 🎉
                            </button>
                            <button className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default StoriesBar;
