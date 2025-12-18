"use client";

import { useState } from "react";
import { Award, ExternalLink, Plus, Edit3, Trash2 } from "lucide-react";
import { PortfolioItem, deletePortfolioItem } from "@/services/portfolioService";
import { toast } from "@/lib/toast";
import { PortfolioItemModal } from "./PortfolioItemModal";

interface PortfolioSectionProps {
    items: PortfolioItem[];
    onRefresh?: () => void;
    readOnly?: boolean;
}

export function PortfolioSection({ items, onRefresh, readOnly }: PortfolioSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | undefined>(undefined);

    const handleEdit = (item: PortfolioItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedItem(undefined);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this portfolio item?")) return;
        try {
            await deletePortfolioItem(id);
            toast.success("Item deleted");
            onRefresh?.();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Portfolio & Projects
                </h2>
                {!readOnly && (
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                )}
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all hover:shadow-lg">
                            {item.media_url ? (
                                <div className="aspect-video w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                                    <img src={item.media_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                            ) : (
                                <div className="aspect-video w-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 flex items-center justify-center">
                                    <Award className="w-12 h-12 text-emerald-200 dark:text-emerald-800" />
                                </div>
                            )}

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                                    {!readOnly && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-emerald-600">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                                )}
                                {item.external_url && (
                                    <a
                                        href={item.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                    >
                                        View Project <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">Showcase your best work here.</p>
                    {!readOnly && (
                        <button
                            onClick={handleAdd}
                            className="mt-4 text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                        >
                            Create your first portfolio item →
                        </button>
                    )}
                </div>
            )}

            {!readOnly && (
                <PortfolioItemModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={selectedItem}
                    onSuccess={onRefresh || (() => { })}
                />
            )}
        </div>
    );
}
