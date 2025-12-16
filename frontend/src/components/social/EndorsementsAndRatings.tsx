"use client";

import React, { useState } from "react";
import { ThumbsUp, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndorsementButtonProps {
    skillName: string;
    endorsementCount: number;
    isEndorsed: boolean;
    onEndorse: () => void;
}

export function EndorsementButton({
    skillName,
    endorsementCount,
    isEndorsed,
    onEndorse
}: EndorsementButtonProps) {
    return (
        <button
            onClick={onEndorse}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isEndorsed
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-700"
                }`}
        >
            <ThumbsUp className={`w-4 h-4 ${isEndorsed ? "fill-current" : ""}`} />
            <span className="font-medium text-sm">{skillName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isEndorsed
                    ? "bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                {endorsementCount}
            </span>
        </button>
    );
}

interface SkillEndorsementSectionProps {
    skills: Array<{
        name: string;
        endorsements: number;
        isEndorsedByMe: boolean;
    }>;
    onEndorse: (skillName: string) => void;
    isOwner: boolean;
}

export function SkillEndorsementSection({ skills, onEndorse, isOwner }: SkillEndorsementSectionProps) {
    if (skills.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No skills added yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    Skills & Endorsements
                </h3>
                {!isOwner && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Click to endorse</span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <EndorsementButton
                        key={skill.name}
                        skillName={skill.name}
                        endorsementCount={skill.endorsements}
                        isEndorsed={skill.isEndorsedByMe}
                        onEndorse={() => !isOwner && onEndorse(skill.name)}
                    />
                ))}
            </div>
        </div>
    );
}

interface RatingStarsProps {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function RatingStars({ value, onChange, readonly = false, size = "md" }: RatingStarsProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    const starSize = sizes[size];
    const displayValue = hoverValue ?? value;

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHoverValue(star)}
                    onMouseLeave={() => setHoverValue(null)}
                    className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
                >
                    <svg
                        className={`${starSize} ${star <= displayValue ? "text-emerald-400 fill-emerald-400" : "text-gray-300 dark:text-gray-600"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

interface WriteReviewProps {
    onSubmit: (rating: number, comment: string) => void;
    isSubmitting?: boolean;
}

export function WriteReview({ onSubmit, isSubmitting }: WriteReviewProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, comment);
        setRating(0);
        setComment("");
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Write a Review</h4>

            <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Your Rating</label>
                <RatingStars value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Your Review (optional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience working with this person..."
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none min-h-[100px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
            </div>

            <Button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
                {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
        </form>
    );
}
