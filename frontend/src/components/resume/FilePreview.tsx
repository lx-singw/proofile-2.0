"use client";

import { useState } from "react";
import { X, FileText, File as FileIcon } from "lucide-react";

interface FilePreviewProps {
    file: File;
    onClose: () => void;
    onConfirm: () => void;
}

export default function FilePreview({ file, onClose, onConfirm }: FilePreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [textContent, setTextContent] = useState<string>("");

    const fileType = file.type;
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(2); // KB

    // Load file content on mount
    useState(() => {
        if (fileType === "application/pdf") {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (fileType.includes("text") || fileName.endsWith(".txt")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setTextContent(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            File Preview
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {fileName} • {fileSize} KB
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-6">
                    {fileType === "application/pdf" && previewUrl && (
                        <div className="w-full h-full min-h-[500px]">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
                                title="PDF Preview"
                            />
                        </div>
                    )}

                    {(fileType.includes("text") || fileName.endsWith(".txt")) && textContent && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm">
                            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                {textContent.substring(0, 2000)}
                                {textContent.length > 2000 && "\n\n... (preview truncated)"}
                            </pre>
                        </div>
                    )}

                    {fileType.includes("word") && (
                        <div className="text-center py-12">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                DOCX preview not available
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                Click "Analyze Resume" to see extracted content
                            </p>
                        </div>
                    )}

                    {!fileType.includes("pdf") && !fileType.includes("text") && !fileType.includes("word") && !fileName.endsWith(".txt") && (
                        <div className="text-center py-12">
                            <FileIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Preview not available for this file type
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                        Analyze Resume
                    </button>
                </div>
            </div>
        </div>
    );
}
