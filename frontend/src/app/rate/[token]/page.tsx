"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Star,
    User,
    Building2,
    Briefcase,
    Mail,
    Phone,
    Linkedin,
    Eye,
    EyeOff,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RatingRequestData {
    id: number;
    invitee_name: string;
    relationship_type: string;
    company: string;
    role_at_company?: string;
    personal_message?: string;
    expires_at: string;
    requester: {
        id: number;
        full_name: string;
        username: string;
        avatar_url?: string;
        headline?: string;
    };
}

const ATTRIBUTES = [
    { id: "technical_skills", label: "Technical Skills" },
    { id: "communication", label: "Communication" },
    { id: "reliability", label: "Reliability" },
    { id: "teamwork", label: "Teamwork" },
    { id: "problem_solving", label: "Problem Solving" },
    { id: "leadership", label: "Leadership" },
];

export default function RateTokenPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [requestData, setRequestData] = useState<RatingRequestData | null>(null);

    const [formData, setFormData] = useState({
        score: 0,
        review: "",
        strengths: "",
        areas_for_growth: "",
        work_again: "",
        rater_email: "",
        rater_phone: "",
        rater_company_email: "",
        rater_linkedin_url: "",
        contact_visible_to_public: false,
        is_anonymous: false,
    });

    useEffect(() => {
        loadRequest();
    }, [token]);

    const loadRequest = async () => {
        try {
            const response = await fetch(`/api/v1/rating-requests/token/${token}`);

            if (!response.ok) {
                const data = await response.json();
                setError(data.detail || "Invalid or expired link");
                setLoading(false);
                return;
            }

            const data = await response.json();
            setRequestData(data);
            setLoading(false);
        } catch (err) {
            setError("Failed to load rating request");
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.score === 0) {
            alert("Please select a rating");
            return;
        }

        if (!formData.rater_email) {
            alert("Please provide your email for verification");
            return;
        }

        setSubmitting(true);

        try {
            const params = new URLSearchParams({
                score: formData.score.toString(),
                category: "general",
                review: formData.review,
                strengths: formData.strengths,
                work_again: formData.work_again,
                rater_email: formData.rater_email,
                rater_phone: formData.rater_phone,
                rater_company_email: formData.rater_company_email,
                rater_linkedin_url: formData.rater_linkedin_url,
                contact_visible_to_public: formData.contact_visible_to_public.toString(),
                is_anonymous: formData.is_anonymous.toString(),
            });

            if (formData.areas_for_growth) {
                params.append("areas_for_growth", formData.areas_for_growth);
            }

            const headers: Record<string, string> = {};
            const authToken = localStorage.getItem("token");
            if (authToken) {
                headers["Authorization"] = `Bearer ${authToken}`;
            }

            const response = await fetch(`/api/v1/rating-requests/${requestData?.id}/complete?${params.toString()}`, {
                method: "POST",
                headers,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to submit rating");
            }

            setSuccess(true);
        } catch (err: any) {
            alert(err.message || "Failed to submit rating");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => (
        <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, score: star }))}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`w-10 h-10 ${star <= formData.score
                                ? "text-emerald-400 fill-emerald-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                    />
                </button>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Link Invalid
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Thank You!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your rating for {requestData?.requester.full_name} has been submitted.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {requestData?.requester.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Rate {requestData?.requester.full_name}
                            </h1>
                            <p className="text-gray-500">{requestData?.requester.headline}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                            <Briefcase className="w-4 h-4" />
                            {requestData?.relationship_type}
                        </span>
                        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                            <Building2 className="w-4 h-4" />
                            {requestData?.company}
                        </span>
                    </div>

                    {requestData?.personal_message && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 italic text-gray-600 dark:text-gray-400">
                            "{requestData.personal_message}"
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Expires: {new Date(requestData?.expires_at || "").toLocaleDateString()}
                    </div>
                </div>

                {/* Rating Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
                    {/* Overall Rating */}
                    <div className="text-center">
                        <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Overall Rating *
                        </label>
                        {renderStars()}
                        <p className="text-sm text-gray-500 mt-2">
                            {formData.score === 0 ? "Select a rating" : `${formData.score} / 5`}
                        </p>
                    </div>

                    {/* Review */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Write a Review
                        </label>
                        <textarea
                            value={formData.review}
                            onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
                            placeholder="Share your experience working with this person..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[100px]"
                        />
                    </div>

                    {/* Strengths */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Key Strengths
                        </label>
                        <textarea
                            value={formData.strengths}
                            onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                            placeholder="What are their greatest professional strengths?"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none min-h-[80px]"
                        />
                    </div>

                    {/* Work Again */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Would you work with them again?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["definitely", "probably", "maybe", "probably_not"].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, work_again: option }))}
                                    className={`px-4 py-2 rounded-lg border text-sm ${formData.work_again === option
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700"
                                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {option.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Verifiable Contact Info Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Your Contact Info (for verification)
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Provide verifiable contact details. This helps build trust.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Mail className="w-4 h-4" /> Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.rater_email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rater_email: e.target.value }))}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Mail className="w-4 h-4" /> Work Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.rater_company_email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rater_company_email: e.target.value }))}
                                    placeholder="your@company.com"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Phone className="w-4 h-4" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.rater_phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rater_phone: e.target.value }))}
                                    placeholder="+27..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                </label>
                                <input
                                    type="url"
                                    value={formData.rater_linkedin_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rater_linkedin_url: e.target.value }))}
                                    placeholder="linkedin.com/in/yourprofile"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Privacy Controls */}
                        <div className="mt-4 space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.contact_visible_to_public}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contact_visible_to_public: e.target.checked }))}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Eye className="w-4 h-4" />
                                    Make my contact info visible publicly
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_anonymous}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <EyeOff className="w-4 h-4" />
                                    Submit rating anonymously (name hidden)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || formData.score === 0}
                        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit Rating
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
