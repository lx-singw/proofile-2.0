"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Search,
    User as UserIcon,
    Briefcase,
    Calendar,
    Check,
    Loader2,
    Plus
} from "lucide-react";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";

interface User {
    id: number;
    full_name: string;
    username?: string;
    headline?: string;
    avatar_url?: string;
}

interface AddCollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddCollaboratorModal({ isOpen, onClose, onSuccess }: AddCollaboratorModalProps) {
    const [step, setStep] = useState<"search" | "details">("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [projectData, setProjectData] = useState({
        project_name: "",
        company: "",
        role: "",
        description: "",
        start_date: "",
        end_date: ""
    });

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const response = await apiRequest<{ profiles: User[] }>({
                method: "GET",
                url: `/api/v1/discovery/search?q=${encodeURIComponent(searchQuery)}`
            });
            setSearchResults(response.profiles || []);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setStep("details");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            const params = new URLSearchParams();
            params.append("collaborator_id", selectedUser.id.toString());
            params.append("project_name", projectData.project_name);
            params.append("company", projectData.company);
            if (projectData.role) params.append("role", projectData.role);
            if (projectData.description) params.append("description", projectData.description);
            if (projectData.start_date) params.append("start_date", projectData.start_date);
            if (projectData.end_date) params.append("end_date", projectData.end_date);

            await apiRequest({
                method: "POST",
                url: `/api/v1/collaborators?${params.toString()}`
            });

            toast.success(`Invitation sent to ${selectedUser.full_name}`);
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            toast.error(error?.detail || "Failed to send invitation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep("search");
        setSearchQuery("");
        setSearchResults([]);
        setSelectedUser(null);
        setProjectData({
            project_name: "",
            company: "",
            role: "",
            description: "",
            start_date: "",
            end_date: ""
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Add Project Collaborator
                        </h2>
                        <p className="text-sm text-gray-500">
                            Verify your work history by tagging colleagues
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {step === "search" ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="min-h-[200px]">
                                {isSearching ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleUserSelect(user)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                            >
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                        <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{user.headline || user.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : searchQuery.length >= 2 ? (
                                    <p className="text-center text-gray-500 py-8">No users found</p>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">Type at least 2 characters to search</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mb-6">
                                {selectedUser?.avatar_url ? (
                                    <img src={selectedUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Collaborating with</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedUser?.full_name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep("search")}
                                    className="ml-auto text-xs text-emerald-600 hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={projectData.project_name}
                                    onChange={e => setProjectData(prev => ({ ...prev, project_name: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                    placeholder="e.g. Mobile App Redesign"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
                                <input
                                    required
                                    type="text"
                                    value={projectData.company}
                                    onChange={e => setProjectData(prev => ({ ...prev, company: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                    placeholder="e.g. TechCorp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Role (Optional)</label>
                                <input
                                    type="text"
                                    value={projectData.role}
                                    onChange={e => setProjectData(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                    placeholder="e.g. Lead Designer"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={projectData.start_date}
                                        onChange={e => setProjectData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={projectData.end_date}
                                        onChange={e => setProjectData(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <textarea
                                    value={projectData.description}
                                    onChange={e => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-24 resize-none"
                                    placeholder="Briefly describe what you worked on..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Send Invite
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
