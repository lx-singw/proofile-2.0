"use client";

import React, { useRef, useState, useCallback } from "react";
import { Camera, FileText, Upload, X, RotateCcw, Check } from "lucide-react";

interface DocumentScanProps {
    onCapture: (imageData: string) => void;
    documentType?: "id_front" | "id_back" | "document";
    onError?: (error: string) => void;
}

export default function DocumentScan({
    onCapture,
    documentType = "document",
    onError
}: DocumentScanProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [mode, setMode] = useState<"choose" | "preview">("choose");

    const getInstructions = () => {
        switch (documentType) {
            case "id_front":
                return "Front of your ID";
            case "id_back":
                return "Back of your ID";
            default:
                return "Upload Document";
        }
    };

    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            onError?.("Please upload an image (JPG, PNG) or PDF");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            onError?.("File size must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreview(result);
            setMode("preview");
        };
        reader.readAsDataURL(file);
    }, [onError]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const confirmCapture = () => {
        if (preview) {
            onCapture(preview);
        }
    };

    const reset = () => {
        setPreview(null);
        setMode("choose");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (mode === "preview" && preview) {
        return (
            <div className="max-w-md mx-auto">
                <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-slate-50 dark:bg-slate-800">
                    {preview.startsWith("data:application/pdf") ? (
                        <div className="aspect-[4/3] flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="w-16 h-16 mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">PDF Document</p>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={preview}
                            alt="Document preview"
                            className="w-full aspect-[4/3] object-contain"
                        />
                    )}

                    {/* Overlay controls */}
                    <div className="absolute top-2 right-2">
                        <button
                            onClick={reset}
                            className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-700"
                        >
                            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex justify-center gap-3">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Retake
                    </button>
                    <button
                        onClick={confirmCapture}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        <Check className="w-4 h-4" />
                        Use This
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleInputChange}
                    className="hidden"
                    capture="environment"
                />

                <div className="py-12 px-6 text-center">
                    {/* Document frame illustration */}
                    <div className="relative w-32 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 border-2 border-slate-300 dark:border-slate-600 rounded-lg">
                            {/* Corner markers */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                        </div>
                        <FileText className="absolute inset-0 m-auto w-10 h-10 text-slate-400" />
                    </div>

                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {getInstructions()}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Drag & drop or tap to upload
                    </p>

                    <div className="flex justify-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400">
                            <Camera className="w-3 h-3" />
                            Take Photo
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400">
                            <Upload className="w-3 h-3" />
                            Upload File
                        </span>
                    </div>

                    <p className="mt-4 text-xs text-slate-400">
                        Accepts JPG, PNG, PDF (max 5MB)
                    </p>
                </div>
            </div>
        </div>
    );
}
