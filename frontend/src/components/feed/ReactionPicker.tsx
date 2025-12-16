"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type ReactionType = "like" | "celebrate" | "support" | "insightful" | "curious";

interface Reaction {
    type: ReactionType;
    emoji: string;
    label: string;
    color: string;
}

const REACTIONS: Reaction[] = [
    { type: "like", emoji: "👍", label: "Like", color: "text-emerald-600" },
    { type: "celebrate", emoji: "🎉", label: "Celebrate", color: "text-emerald-600" },
    { type: "support", emoji: "💪", label: "Support", color: "text-green-600" },
    { type: "insightful", emoji: "💡", label: "Insightful", color: "text-emerald-600" },
    { type: "curious", emoji: "🤔", label: "Curious", color: "text-emerald-600" },
];

interface ReactionPickerProps {
    currentReaction?: ReactionType | null;
    onReact: (type: ReactionType | null) => void;
    reactionCounts?: Record<ReactionType, number>;
    compact?: boolean;
}

export function ReactionPicker({
    currentReaction,
    onReact,
    reactionCounts = {} as Record<ReactionType, number>,
    compact = false,
}: ReactionPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);

    const currentReactionData = currentReaction
        ? REACTIONS.find(r => r.type === currentReaction)
        : null;

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    const handleReactionClick = (type: ReactionType) => {
        if (currentReaction === type) {
            onReact(null); // Remove reaction
        } else {
            onReact(type);
        }
        setIsOpen(false);
    };

    const handleButtonClick = () => {
        if (currentReaction) {
            onReact(null); // Remove current reaction
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative">
            {/* Reaction Button */}
            <div
                className="relative"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleButtonClick}
                    className={`flex items-center gap-1.5 rounded-lg transition-colors
                        ${currentReaction
                            ? currentReactionData?.color || "text-emerald-600"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    <span className={`text-lg ${currentReaction ? "scale-110" : ""} transition-transform`}>
                        {currentReactionData?.emoji || "👍"}
                    </span>
                    {!compact && (
                        <span className="text-sm font-medium">
                            {currentReactionData?.label || "Like"}
                        </span>
                    )}
                    {totalReactions > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {totalReactions}
                        </span>
                    )}
                </Button>

                {/* Reaction Picker Popup */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 z-50"
                        >
                            {REACTIONS.map(reaction => (
                                <button
                                    key={reaction.type}
                                    onClick={() => handleReactionClick(reaction.type)}
                                    onMouseEnter={() => setHoveredReaction(reaction.type)}
                                    onMouseLeave={() => setHoveredReaction(null)}
                                    className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
                                        ${currentReaction === reaction.type ? "bg-gray-100 dark:bg-gray-700 scale-110" : ""}
                                        ${hoveredReaction === reaction.type ? "scale-125" : ""}
                                    `}
                                >
                                    <span className="text-2xl">{reaction.emoji}</span>

                                    {/* Tooltip */}
                                    {hoveredReaction === reaction.type && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded whitespace-nowrap">
                                            {reaction.label}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reaction Summary (who reacted) */}
            {totalReactions > 0 && !compact && (
                <div className="flex items-center gap-1 mt-1">
                    {/* Show top 3 reaction emojis */}
                    {Object.entries(reactionCounts)
                        .filter(([_, count]) => count > 0)
                        .sort(([_, a], [__, b]) => b - a)
                        .slice(0, 3)
                        .map(([type]) => {
                            const reaction = REACTIONS.find(r => r.type === type);
                            return (
                                <span key={type} className="text-sm">
                                    {reaction?.emoji}
                                </span>
                            );
                        })}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {totalReactions}
                    </span>
                </div>
            )}
        </div>
    );
}
