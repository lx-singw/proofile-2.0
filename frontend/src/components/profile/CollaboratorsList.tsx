"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    Check,
    X,
    Clock,
    Briefcase,
    Calendar,
    ChevronDown,
    ChevronUp,
    Shield
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";

interface Collaborator {
    id: number;
    project_name: string;
    company: string;
    role?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status: "pending" | "confirmed" | "declined";
    created_at: string;
    // Dynamic fields based on context
    requester?: {
        id: number;
        full_name: string;
        username?: string;
        avatar_url?: string;
        headline?: string;
    };
    peer?: {
        id: number;
        full_name: string;
        username?: string;
        avatar_url?: string;
    };
}

interface CollaboratorsListProps {
    userId: number;
    isOwnProfile: boolean;
}

export function CollaboratorsList({ userId, isOwnProfile }: CollaboratorsListProps) {
    const [activeTab, setActiveTab] = useState<"verified" | "pending">("verified");
    const [verifiedItems, setVerifiedItems] = useState<Collaborator[]>([]);
    const [pendingItems, setPendingItems] = useState<Collaborator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch verified collaborations
            const verified = await apiRequest<Collaborator[]>({
                method: "GET",
                url: `/api/v1/collaborators/user/${userId}`
            });
            setVerifiedItems(verified);

            // Fetch pending requests if own profile
            if (isOwnProfile) {
                const pending = await apiRequest<Collaborator[]>({
                    method: "GET",
                    url: "/api/v1/collaborators/pending"
                });
                setPendingItems(pending);
                if (pending.length > 0) setActiveTab("pending");
            }
        } catch (error) {
            console.error("Failed to fetch collaborations", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId, isOwnProfile]);

    const handleRespond = async (id: number, action: "accept" | "decline") => {
        try {
            await apiRequest({
                method: "POST",
                url: `/api/v1/collaborators/${id}/respond?action=${action}`
            });
            toast.success(action === "accept" ? "Collaboration confirmed!" : "Request declined");
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Failed to respond");
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-400">Loading collaborations...</div>;
    }

    if (!isOwnProfile && verifiedItems.length === 0) {
        return null; // Don't show empty section on public profiles
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Verified Collaborations
                </h2>

                {isOwnProfile && pendingItems.length > 0 && (
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("verified")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTab === "verified"
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            Verified ({verifiedItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === "pending"
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            Pending
                            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                {pendingItems.length}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {activeTab === "pending" && isOwnProfile ? (
                <div className="space-y-4">
                    {pendingItems.map(item => (
                        <div key={item.id} className="border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    {item.requester?.avatar_url ? (
                                        <img src={item.requester.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            <span className="font-bold">{item.requester?.full_name}</span> says you worked together:
                                        </p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                            {item.project_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <Briefcase className="w-3 h-3" /> {item.company}
                                            {item.role && <span>• {item.role}</span>}
                                        </p>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-2 italic">
                                                "{item.description}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleRespond(item.id, "accept")}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => handleRespond(item.id, "decline")}
                                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {verifiedItems.length > 0 ? (
                        verifiedItems.map(item => (
                            <div key={item.id} className="group border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-900/50 bg-white dark:bg-gray-800 rounded-xl p-4 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                                {item.project_name}
                                            </h3>
                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                Verified
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                {item.company}
                                            </div>
                                            {item.start_date && (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(item.start_date).getFullYear()}
                                                    {item.end_date ? ` - ${new Date(item.end_date).getFullYear()}` : " - Present"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            {item.peer?.avatar_url ? (
                                                <img src={item.peer.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <Users className="w-3 h-3 text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Collaborated with <span className="font-medium text-gray-900 dark:text-white">{item.peer?.full_name}</span>
                                            </span>
                                        </div>

                                        {expandedIds.includes(item.id) && item.description && (
                                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {item.description && (
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                                        >
                                            {expandedIds.includes(item.id) ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No verified collaborations yet</p>
                            {isOwnProfile && (
                                <p className="text-sm mt-1">Start verifying your work history by adding collaborators.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
