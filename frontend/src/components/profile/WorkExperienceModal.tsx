"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Briefcase } from "lucide-react";
import { Experience, ExperienceCreate, ExperienceUpdate, createExperience, updateExperience } from "@/services/experienceService";
import { toast } from "@/lib/toast";

interface WorkExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    experience?: Experience;
    onSuccess: () => void;
}

export function WorkExperienceModal({ isOpen, onClose, experience, onSuccess }: WorkExperienceModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ExperienceCreate>({
        company: "",
        title: "",
        location: "",
        start_date: "",
        end_date: "",
        description: "",
        is_current: false,
    });

    useEffect(() => {
        if (experience) {
            setFormData({
                company: experience.company,
                title: experience.title,
                location: experience.location || "",
                start_date: experience.start_date.split("T")[0],
                end_date: experience.end_date ? experience.end_date.split("T")[0] : "",
                description: experience.description || "",
                is_current: experience.is_current,
            });
        } else {
            setFormData({
                company: "",
                title: "",
                location: "",
                start_date: "",
                end_date: "",
                description: "",
                is_current: false,
            });
        }
    }, [experience, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (experience) {
                await updateExperience(experience.id, formData);
                toast.success("Experience updated");
            } else {
                await createExperience(formData);
                toast.success("Experience added");
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(experience ? "Failed to update experience" : "Failed to add experience");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {experience ? "Edit Experience" : "Add Work Experience"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                placeholder="e.g. Senior Software Engineer"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Company Name</label>
                            <input
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
                        <input
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            placeholder="e.g. Remote or Cape Town"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
                            <input
                                required
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Date</label>
                            <input
                                disabled={formData.is_current}
                                required={!formData.is_current}
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={formData.is_current}
                            onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 transition-colors font-medium">
                            I am currently working in this role
                        </span>
                    </label>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white resize-none"
                            placeholder="Describe your responsibilities and achievements..."
                        />
                    </div>
                </form>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            experience ? "Save Changes" : "Save Experience"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
