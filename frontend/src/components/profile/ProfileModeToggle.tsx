"use client";

import Link from "next/link";
import { Pencil, Eye, ExternalLink } from "lucide-react";

interface ProfileModeToggleProps {
    currentMode: "edit" | "preview";
    username: string;
    isPrivate?: boolean;
}

export function ProfileModeToggle({ currentMode, username, isPrivate }: ProfileModeToggleProps) {
    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between py-3">
                    {/* Mode Toggle Buttons */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Link
                            href="/profile"
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentMode === "edit"
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Mode
                        </Link>
                        <Link
                            href={`/p/${username}`}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${currentMode === "preview"
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <Eye className="w-4 h-4" />
                            Preview Mode
                        </Link>
                    </div>

                    {/* Context Message */}
                    <div className="flex items-center gap-4">
                        {currentMode === "edit" && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                Manage your profile details
                            </p>
                        )}
                        {currentMode === "preview" && (
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                    This is how others see your profile
                                </p>
                                {isPrivate && (
                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                                        Private
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Public URL */}
                        {currentMode === "preview" && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                                <ExternalLink className="w-3 h-3" />
                                <span className="font-mono">proofile.co/p/{username}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
