"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

/**
 * ConfirmDialog component
 * A reusable confirmation dialog for important actions
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "warning",
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case "danger":
                return {
                    button: "bg-red-600 hover:bg-red-700",
                    icon: "text-red-600 dark:text-red-500",
                    iconBg: "bg-red-100 dark:bg-red-900/30",
                };
            case "warning":
                return {
                    button: "bg-orange-600 hover:bg-orange-700",
                    icon: "text-orange-600 dark:text-orange-500",
                    iconBg: "bg-orange-100 dark:bg-orange-900/30",
                };
            case "info":
                return {
                    button: "bg-blue-600 hover:bg-blue-700",
                    icon: "text-blue-600 dark:text-blue-500",
                    iconBg: "bg-blue-100 dark:bg-blue-900/30",
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                        <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
