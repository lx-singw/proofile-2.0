"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

interface HelpTooltipProps {
    content: React.ReactNode;
    title?: string;
    className?: string;
    position?: "top" | "bottom" | "left" | "right";
    iconSize?: number;
}

/**
 * HelpTooltip - Contextual help icon with tooltip
 * 
 * Features:
 * - Hover/click to show tooltip
 * - Rich content support
 * - Multiple positions
 * - Click outside to close
 * - Keyboard accessible (Enter/Space to toggle, Escape to close)
 */
export default function HelpTooltip({
    content,
    title,
    className = "",
    position = "top",
    iconSize = 14,
}: HelpTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800 dark:border-t-gray-700 border-x-transparent border-b-transparent",
        bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 dark:border-b-gray-700 border-x-transparent border-t-transparent",
        left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800 dark:border-l-gray-700 border-y-transparent border-r-transparent",
        right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800 dark:border-r-gray-700 border-y-transparent border-l-transparent",
    };

    return (
        <div className={`relative inline-flex ${className}`}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
                aria-label="Help"
                aria-expanded={isOpen}
            >
                <HelpCircle style={{ width: iconSize, height: iconSize }} />
            </button>

            {isOpen && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-[150] ${positionClasses[position]}`}
                    role="tooltip"
                >
                    {/* Arrow */}
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />

                    {/* Content */}
                    <div className="bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-lg max-w-xs p-3 text-sm">
                        {title && (
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{title}</span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-0.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        <div className="text-gray-200">{content}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Pre-built help content for common features
export const HELP_CONTENT = {
    trustScore: {
        title: "Trust Score",
        content: "Your Trust Score is calculated based on your verified credentials, peer reviews, and profile completeness. Higher scores unlock more opportunities.",
    },
    matchPercentage: {
        title: "Match Percentage",
        content: "This shows how well your skills and experience match the job requirements. Jobs with 80%+ match are most likely to respond.",
    },
    reputationScore: {
        title: "Reputation Score",
        content: "Based on ratings from colleagues and managers. Scores above 4.5 put you in the top 15% of professionals.",
    },
    verificationLevel: {
        title: "Verification Levels",
        content: "Level 1: Email/Phone verified. Level 2: Employment verified. Level 3: Identity verified (Gold status).",
    },
    profileCompleteness: {
        title: "Profile Completeness",
        content: "Complete profiles get 3x more views. Add your experience, skills, and education to reach 100%.",
    },
};
