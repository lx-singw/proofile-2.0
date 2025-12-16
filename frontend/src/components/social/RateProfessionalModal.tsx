"use client";

import React, { useState } from "react";
import {
    X,
    Star,
    User,
    Building2,
    Calendar,
    ThumbsUp,
    MessageSquare,
    Eye,
    EyeOff,
    Send,
    Loader2,
    CheckCircle
} from "lucide-react";
import { toast } from "@/lib/toast";

interface RateProfessionalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    professionalName?: string;
    professionalId?: number;
}

const RELATIONSHIP_TYPES = [
    { id: "colleague", label: "Colleague", description: "Worked together on the same team" },
    { id: "manager", label: "Manager", description: "They managed/supervised me" },
    { id: "direct_report", label: "Direct Report", description: "I managed/supervised them" },
    { id: "client", label: "Client", description: "They were my client" },
];

const ATTRIBUTES = [
    { id: "technical_skills", label: "Technical Skills", description: "Expertise and competence" },
    { id: "communication", label: "Communication", description: "Clear and effective communication" },
    { id: "reliability", label: "Reliability", description: "Delivers on commitments" },
    { id: "teamwork", label: "Teamwork", description: "Collaborates well with others" },
    { id: "problem_solving", label: "Problem Solving", description: "Finds creative solutions" },
    { id: "leadership", label: "Leadership", description: "Guides and inspires others" },
];

const WORK_AGAIN_OPTIONS = [
    { id: "definitely", label: "Definitely", value: 5 },
    { id: "probably", label: "Probably", value: 4 },
    { id: "maybe", label: "Maybe", value: 3 },
    { id: "probably_not", label: "Probably Not", value: 2 },
];

export function RateProfessionalModal({
    isOpen,
    onClose,
    onSuccess,
    professionalName = "this professional",
    professionalId
}: RateProfessionalModalProps) {
    const [step, setStep] = useState<"form" | "submitting" | "success">("form");
    const [formData, setFormData] = useState({
        relationship: "",
        company: "",
        startDate: "",
        endDate: "",
        attributeRatings: {} as Record<string, number>,
        strengths: "",
        areasForGrowth: "",
        workAgain: "",
        isPublic: true,
        isAnonymous: false,
    });

    if (!isOpen) return null;

    const handleAttributeRating = (attributeId: string, rating: number) => {
        setFormData(prev => ({
            ...prev,
            attributeRatings: { ...prev.attributeRatings, [attributeId]: rating },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate minimum requirements
        if (!formData.relationship || !formData.company ||
            Object.keys(formData.attributeRatings).length < 3) {
            toast.error("Please complete all required fields");
            return;
        }

        setStep("submitting");

        try {
            // API call would go here
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep("success");
            toast.success("Rating submitted successfully!");
        } catch (error) {
            toast.error("Failed to submit rating");
            setStep("form");
        }
    };

    const handleClose = () => {
        setStep("form");
        setFormData({
            relationship: "",
            company: "",
            startDate: "",
            endDate: "",
            attributeRatings: {},
            strengths: "",
            areasForGrowth: "",
            workAgain: "",
            isPublic: true,
            isAnonymous: false,
        });
        onClose();
        if (step === "success") {
            onSuccess();
        }
    };

    const renderStars = (attributeId: string) => {
        const rating = formData.attributeRatings[attributeId] || 0;
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleAttributeRating(attributeId, star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-5 h-5 ${star <= rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Rate {professionalName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Share your professional experience
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {step === "form" && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Relationship Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Your Relationship *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {RELATIONSHIP_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, relationship: type.id }))}
                                        className={`p-3 rounded-lg border text-left transition-all ${formData.relationship === type.id
                                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {type.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Where & When */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Company *
                                </label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    placeholder="Where did you work together?"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        From
                                    </label>
                                    <input
                                        type="month"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        To
                                    </label>
                                    <input
                                        type="month"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attribute Ratings */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Rate Specific Attributes (1-5) *
                            </label>
                            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                {ATTRIBUTES.map((attr) => (
                                    <div key={attr.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {attr.label}
                                            </div>
                                        </div>
                                        {renderStars(attr.id)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4" />
                                Key Strengths *
                            </label>
                            <textarea
                                value={formData.strengths}
                                onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                                placeholder="What are their greatest professional strengths?"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none min-h-[80px]"
                            />
                        </div>

                        {/* Areas for Growth (Private) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Areas for Growth
                                <span className="text-xs text-gray-400 font-normal">(Private - only visible to them)</span>
                            </label>
                            <textarea
                                value={formData.areasForGrowth}
                                onChange={(e) => setFormData(prev => ({ ...prev, areasForGrowth: e.target.value }))}
                                placeholder="Constructive feedback (optional)"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none min-h-[60px]"
                            />
                        </div>

                        {/* Would Work Again */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Would you work with them again?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {WORK_AGAIN_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, workAgain: option.id }))}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${formData.workAgain === option.id
                                                ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                                                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Privacy Options */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                />
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Make this rating public on their profile
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isAnonymous}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                />
                                <div className="flex items-center gap-2">
                                    <EyeOff className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Submit anonymously (rating visible, your name hidden)
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            Submit Rating
                        </button>
                    </form>
                )}

                {step === "submitting" && (
                    <div className="p-12 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Submitting your rating...</p>
                    </div>
                )}

                {step === "success" && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Rating Submitted!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Thank you for helping build trust in our professional community.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
