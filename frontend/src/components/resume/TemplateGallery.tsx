"use client";

import { useState, useEffect } from "react";
import { Check, Layout, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    styles: any;
}

interface TemplateGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    currentTemplateId?: string;
    onSelect: (templateId: string) => void;
}

export default function TemplateGallery({ isOpen, onClose, currentTemplateId, onSelect }: TemplateGalleryProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            // Mock data for now if API fails
            const mockTemplates = [
                {
                    id: "modern",
                    name: "Modern Professional",
                    description: "Clean, minimalist design suitable for tech and creative roles.",
                    thumbnail: "https://placehold.co/400x600/2563eb/white?text=Modern",
                    styles: { primaryColor: "#2563eb" }
                },
                {
                    id: "classic",
                    name: "Classic Executive",
                    description: "Traditional layout perfect for corporate and management positions.",
                    thumbnail: "https://placehold.co/400x600/1f2937/white?text=Classic",
                    styles: { primaryColor: "#1f2937" }
                },
                {
                    id: "creative",
                    name: "Creative Portfolio",
                    description: "Bold design that highlights skills and projects.",
                    thumbnail: "https://placehold.co/400x600/7c3aed/white?text=Creative",
                    styles: { primaryColor: "#7c3aed" }
                }
            ];

            // Try fetching from API
            try {
                const res = await fetch('/api/v1/resumes/templates/list');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setTemplates(data);
                    } else {
                        setTemplates(mockTemplates);
                    }
                } else {
                    setTemplates(mockTemplates);
                }
            } catch (e) {
                setTemplates(mockTemplates);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (templateId: string) => {
        setApplying(templateId);
        try {
            await onSelect(templateId);
            toast.success("Template applied successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to apply template");
        } finally {
            setApplying(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Close
                    </button>
                </div>

                {/* Grid */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${currentTemplateId === template.id
                                            ? 'border-emerald-600 ring-2 ring-emerald-600 ring-offset-2 dark:ring-offset-gray-800'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                                        }`}
                                    onClick={() => handleSelect(template.id)}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-[1/1.4] bg-gray-100 dark:bg-gray-900 relative">
                                        {/* Placeholder for actual thumbnail */}
                                        <div
                                            className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg font-medium"
                                            style={{ backgroundColor: template.styles?.primaryColor + '10' }}
                                        >
                                            {template.name} Preview
                                        </div>

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                {applying === template.id ? 'Applying...' : 'Select Template'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 bg-white dark:bg-gray-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                            {currentTemplateId === template.id && (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
