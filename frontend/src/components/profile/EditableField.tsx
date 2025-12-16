"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Edit2 } from "lucide-react";

interface EditableFieldProps {
    value: string;
    onSave: (newValue: string) => Promise<void> | void;
    label?: string; // For accessibility
    isOwner?: boolean;
    type?: "text" | "textarea";
    placeholder?: string;
    className?: string; // Applied to the display text
}

export function EditableField({
    value: initialValue,
    onSave,
    label,
    isOwner = false,
    type = "text",
    placeholder = "Click to edit...",
    className,
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (value.trim() === initialValue) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await onSave(value);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
            // Ideally show toast here, but keeping component pure
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setValue(initialValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (!isEditing) {
        return (
            <div
                className={cn(
                    "group relative rounded-md transition-colors",
                    isOwner ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1" : ""
                )}
                onClick={() => isOwner && setIsEditing(true)}
            >
                <div className={cn("break-words", className)}>
                    {value || <span className="text-gray-400 italic">{placeholder}</span>}
                </div>
                {isOwner && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3 h-3 text-gray-400" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-2 items-start relative z-20">
            {type === "textarea" ? (
                <textarea
                    ref={inputRef as any}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 rounded-md border border-emerald-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 min-h-[100px] resize-y text-gray-900 dark:text-gray-100"
                    placeholder={placeholder}
                    aria-label={label}
                />
            ) : (
                <input
                    ref={inputRef as any}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 rounded-md border border-emerald-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 text-gray-900 dark:text-gray-100"
                    placeholder={placeholder}
                    aria-label={label}
                />
            )}

            <div className="flex flex-col gap-1">
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors disabled:opacity-50"
                    title="Save (Enter)"
                >
                    <Check className="w-4 h-4" />
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50"
                    title="Cancel (Esc)"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
