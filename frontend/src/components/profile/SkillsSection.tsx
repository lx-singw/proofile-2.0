"use client";

import React from "react";
import { Award, CheckCircle2, ThumbsUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Endorser {
    id: number;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
}

export interface Skill {
    id: string;
    name: string;
    endorsements_count: number;
    endorsers: Endorser[];
    is_verified?: boolean; // Verified via assessment or project
}

interface SkillsSectionProps {
    skills: string[] | Skill[];
    isOwnProfile: boolean;
    onEndorse?: (skillName: string) => void;
}

export function SkillsSection({ skills, isOwnProfile, onEndorse }: SkillsSectionProps) {
    // Transform string array to Skill array if needed (fallback for legacy data)
    const normalizedSkills: Skill[] = skills.map((s, idx) => {
        if (typeof s === "string") {
            return {
                id: `skill-${idx}`,
                name: s,
                endorsements_count: 0,
                endorsers: []
            };
        }
        return s;
    });

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Skills & Endorsements
                </h2>
                {isOwnProfile && (
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        + Add Skill
                    </button>
                )}
            </div>

            {normalizedSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {normalizedSkills.map((skill) => (
                        <div
                            key={skill.id}
                            className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {skill.name}
                                        {skill.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-600" title="Verified Skill" />}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {skill.endorsements_count} endorsement{skill.endorsements_count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {!isOwnProfile && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEndorse?.(skill.name)}
                                        className="rounded-lg h-8 px-3 text-xs gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 hover:border-emerald-500/50 transition-all"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        Endorse
                                    </Button>
                                )}
                            </div>

                            {skill.endorsers.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {skill.endorsers.slice(0, 3).map((endorser) => (
                                            <div
                                                key={endorser.id}
                                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 overflow-hidden"
                                                title={endorser.name}
                                            >
                                                {endorser.avatar_url ? (
                                                    <img src={endorser.avatar_url} alt={endorser.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    endorser.name.charAt(0)
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {skill.endorsers.length > 3 && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                                            +{skill.endorsers.length - 3} others
                                        </span>
                                    )}
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1">
                                        {skill.endorsers[0].name} and others endorsed this
                                    </span>
                                </div>
                            )}

                            {skill.endorsers.length === 0 && !isOwnProfile && (
                                <p className="text-[11px] text-gray-400 italic">Be the first to endorse this skill</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No skills added yet</p>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <Users className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Social Proof Engine</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Verified colleagues' endorsements carry {isOwnProfile ? '5x' : '5x'} more trust weight.</p>
                </div>
            </div>
        </div>
    );
}
