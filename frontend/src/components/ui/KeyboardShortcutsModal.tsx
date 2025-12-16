"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * KeyboardShortcutsModal - Displays available keyboard shortcuts
 */
export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4">
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Keyboard className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Keyboard Shortcuts
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Shortcuts List */}
                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                        {SHORTCUTS.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2"
                            >
                                <span className="text-gray-700 dark:text-gray-300">
                                    {shortcut.description}
                                </span>
                                <div className="flex items-center gap-1">
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <React.Fragment key={keyIndex}>
                                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-mono border border-gray-200 dark:border-gray-600">
                                                {key}
                                            </kbd>
                                            {keyIndex < shortcut.keys.length - 1 && (
                                                <span className="text-gray-400 text-xs">then</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono">?</kbd> anytime to show this help
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
