"use client";

import { useState } from "react";
import { Briefcase, Edit3, Trash2, CheckCircle, Plus, UserCheck } from "lucide-react";
import { Experience, deleteExperience } from "@/services/experienceService";
import { toast } from "@/lib/toast";
import { WorkExperienceModal } from "./WorkExperienceModal";
import { PeerVerificationModal } from "./PeerVerificationModal";

interface ExperienceSectionProps {
    experiences: Experience[];
    isLoading?: boolean;
    onRefresh?: () => void;
    readOnly?: boolean;
}

export function ExperienceSection({ experiences, isLoading, onRefresh, readOnly }: ExperienceSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [selectedExp, setSelectedExp] = useState<Experience | undefined>(undefined);

    const handleEdit = (exp: Experience) => {
        setSelectedExp(exp);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedExp(undefined);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this experience?")) return;
        try {
            await deleteExperience(id);
            toast.success("Experience deleted");
            onRefresh?.();
        } catch (error) {
            toast.error("Failed to delete experience");
        }
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    Work Experience
                </h2>
                {!readOnly && (
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Experience
                    </button>
                )}
            </div>

            {experiences.length > 0 ? (
                <div className="space-y-8">
                    {experiences.map((exp) => (
                        <div key={exp.id} className="group relative flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40 flex-shrink-0 flex items-center justify-center text-emerald-600 font-bold text-sm border border-emerald-100 dark:border-emerald-800">
                                {exp.company.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {exp.title}
                                            {exp.is_verified && (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">{exp.company}</p>
                                            {!exp.is_verified && !readOnly && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedExp(exp);
                                                        setIsVerifyModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                                >
                                                    <UserCheck className="w-3 h-3" />
                                                    Ask Peer to Verify
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} - {exp.is_current ? "Present" : exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ""}
                                        </p>
                                    </div>

                                    {!readOnly && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(exp)}
                                                className="p-1.5 text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {exp.description && (
                                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                                        {exp.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">No experience items added yet.</p>
                    {!readOnly && (
                        <button
                            onClick={handleAdd}
                            className="mt-4 text-emerald-600 hover:text-emerald-700 font-bold text-sm"
                        >
                            Build your work record now →
                        </button>
                    )}
                </div>
            )}

            {!readOnly && (
                <WorkExperienceModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    experience={selectedExp}
                    onSuccess={onRefresh || (() => { })}
                />
            )}

            {isVerifyModalOpen && selectedExp && (
                <PeerVerificationModal
                    isOpen={isVerifyModalOpen}
                    onClose={() => setIsVerifyModalOpen(false)}
                    company={selectedExp.company}
                    role={selectedExp.title}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
}
