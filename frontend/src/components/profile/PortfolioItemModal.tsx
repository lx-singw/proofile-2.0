"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Award, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { PortfolioItem, PortfolioItemCreate, PortfolioItemUpdate, createPortfolioItem, updatePortfolioItem } from "@/services/portfolioService";
import { toast } from "@/lib/toast";

interface PortfolioItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: PortfolioItem;
    onSuccess: () => void;
}

export function PortfolioItemModal({ isOpen, onClose, item, onSuccess }: PortfolioItemModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<PortfolioItemCreate>({
        title: "",
        description: "",
        media_url: "",
        external_url: "",
        experience_id: undefined,
    });

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title,
                description: item.description || "",
                media_url: item.media_url || "",
                external_url: item.external_url || "",
                experience_id: item.experience_id,
            });
        } else {
            setFormData({
                title: "",
                description: "",
                media_url: "",
                external_url: "",
                experience_id: undefined,
            });
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (item) {
                await updatePortfolioItem(item.id, formData);
                toast.success("Project updated");
            } else {
                await createPortfolioItem(formData);
                toast.success("Project added to portfolio");
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(item ? "Failed to update project" : "Failed to add project");
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
                            <Award className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {item ? "Edit Project" : "Add Portfolio Project"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project Title</label>
                        <input
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            placeholder="e.g. Portfolio Website or E-commerce Backend"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white resize-none"
                            placeholder="Briefly describe what you built and the tech used..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Media URL (Image or Video)
                        </label>
                        <input
                            value={formData.media_url}
                            onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> External Link (GitHub, Live Project)
                        </label>
                        <input
                            value={formData.external_url}
                            onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            placeholder="https://github.com/yourusername/project"
                        />
                    </div>

                    {/* Experience selection could be added here later */}
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
                            item ? "Update Project" : "Add to Portfolio"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
