'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ResumeDropzoneProps {
    onFileSelect: (file: File) => void;
    onUploadComplete?: (resumeId: string) => void;
    uploading?: boolean;
    error?: string | null;
}

export default function ResumeDropzone({
    onFileSelect,
    onUploadComplete,
    uploading = false,
    error = null
}: ResumeDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            handleFileSelection(file);
        }
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelection(files[0]);
        }
    }, []);

    const handleFileSelection = (file: File) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'application/rtf',
            'application/vnd.oasis.opendocument.text'
        ];

        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            alert('Invalid file type. Please upload PDF, DOCX, TXT, RTF, or ODT files.');
            return;
        }

        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit.');
            return;
        }

        setSelectedFile(file);
        setUploadSuccess(false);
        onFileSelect(file);
    };

    // Visual states
    const getDropzoneClasses = () => {
        const baseClasses = "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer";

        if (uploadSuccess) {
            return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20`;
        }

        if (error) {
            return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake`;
        }

        if (uploading) {
            return `${baseClasses} border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20`;
        }

        if (isDragging) {
            return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20 scale-105 shadow-lg`;
        }

        return `${baseClasses} border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800/50`;
    };

    return (
        <div
            className={getDropzoneClasses()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && document.getElementById('file-input')?.click()}
        >
            <input
                id="file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
            />

            <div className="flex flex-col items-center justify-center text-center">
                {/* Icon */}
                <div className="mb-6">
                    {uploadSuccess ? (
                        <CheckCircle className="w-16 h-16 text-green-600 animate-bounce" />
                    ) : error ? (
                        <XCircle className="w-16 h-16 text-red-600" />
                    ) : uploading ? (
                        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                    ) : (
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center ${isDragging ? 'scale-110' : ''} transition-transform`}>
                            <Upload className="w-10 h-10 text-white" />
                        </div>
                    )}
                </div>

                {/* Text */}
                <div className="space-y-2">
                    {uploadSuccess ? (
                        <>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                                Upload Successful!
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-500">
                                Analyzing your resume...
                            </p>
                        </>
                    ) : error ? (
                        <>
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                                Upload Failed
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                        </>
                    ) : uploading ? (
                        <>
                            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                Uploading...
                            </h3>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500">
                                {selectedFile?.name}
                            </p>
                        </>
                    ) : isDragging ? (
                        <>
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                                Drop to Upload
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-500">
                                Release to start analyzing
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Drag & Drop Your Resume
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                or click to browse
                            </p>
                        </>
                    )}
                </div>

                {/* File info */}
                {!uploading && !uploadSuccess && !error && (
                    <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Supported formats: PDF, DOCX, TXT, RTF, ODT</p>
                        <p>Maximum size: 10 MB</p>
                    </div>
                )}

                {/* Selected file preview */}
                {selectedFile && !uploading && !uploadSuccess && !error && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
