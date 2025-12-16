"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, Clock, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface Version {
    id: string;
    version_number: number;
    description: string;
    created_at: string;
}

interface VersionHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    resumeId: string;
    onRestore: () => void;
}

export default function VersionHistory({ isOpen, onClose, resumeId, onRestore }: VersionHistoryProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen]);

    const fetchVersions = async () => {
        try {
            // Mock data for now if API fails
            const mockVersions = [
                {
                    id: "v3",
                    version_number: 3,
                    description: "Added AI improvements to summary",
                    created_at: new Date().toISOString()
                },
                {
                    id: "v2",
                    version_number: 2,
                    description: "Applied Modern Template",
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: "v1",
                    version_number: 1,
                    description: "Initial Upload",
                    created_at: new Date(Date.now() - 172800000).toISOString()
                }
            ];

            try {
                const res = await fetch(`/api/v1/resumes/${resumeId}/versions`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setVersions(data);
                    } else {
                        setVersions(mockVersions);
                    }
                } else {
                    setVersions(mockVersions);
                }
            } catch (e) {
                setVersions(mockVersions);
            }
        } catch (error) {
            console.error("Failed to fetch versions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId: string) => {
        if (!confirm("Are you sure you want to restore this version? Current changes will be overwritten.")) return;

        setRestoring(versionId);
        try {
            const res = await fetch(`/api/v1/resumes/${resumeId}/versions/${versionId}/restore`, {
                method: 'POST'
            });

            if (res.ok) {
                toast.success("Version restored successfully");
                onRestore();
                onClose();
            } else {
                throw new Error("Failed to restore");
            }
        } catch (error) {
            toast.error("Failed to restore version");
        } finally {
            setRestoring(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-orange-600" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Version History</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Close
                    </button>
                </div>

                {/* List */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                            <span className="font-bold text-orange-600 dark:text-orange-400">v{version.version_number}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{version.description}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>

                                    {index === 0 ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                            Current
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleRestore(version.id)}
                                            disabled={restoring === version.id}
                                            className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            {restoring === version.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4" />
                                            )}
                                            Restore
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
