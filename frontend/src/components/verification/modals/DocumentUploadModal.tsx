'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (documentUrl: string) => void;
    targetType: 'employment' | 'education';
    targetName?: string; // e.g., "TechCorp" or "MIT"
}

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

/**
 * DocumentUploadModal - Drag & drop document upload with AI analysis feedback
 * 
 * Accepts: PDF, JPG, PNG (max 5MB)
 * Shows real-time AI analysis progress
 */
export default function DocumentUploadModal({
    isOpen,
    onClose,
    onSuccess,
    targetType,
    targetName = 'Unknown'
}: DocumentUploadModalProps) {
    const [state, setState] = useState<UploadState>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analysisMessages, setAnalysisMessages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const validateFile = (file: File): boolean => {
        if (!acceptedTypes.includes(file.type)) {
            setError('Invalid file type. Please upload PDF, JPG, or PNG.');
            return false;
        }
        if (file.size > maxFileSize) {
            setError('File too large. Maximum size is 5MB.');
            return false;
        }
        setError(null);
        return true;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
        }
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setState('uploading');
        setAnalysisMessages([]);

        // Simulate upload progress
        await new Promise(r => setTimeout(r, 1000));

        setState('analyzing');
        setAnalysisMessages(['📄 Reading document...']);
        await new Promise(r => setTimeout(r, 800));

        setAnalysisMessages(prev => [...prev, '🔍 Detecting company logo...']);
        await new Promise(r => setTimeout(r, 600));

        setAnalysisMessages(prev => [...prev, `✅ Found: "${targetName}"`]);
        await new Promise(r => setTimeout(r, 500));

        setAnalysisMessages(prev => [...prev, '📊 Matching dates...']);
        await new Promise(r => setTimeout(r, 700));

        setAnalysisMessages(prev => [...prev, '✅ Match Confidence: 98%']);

        // Simulate success
        setState('success');

        // In real implementation, call API here
        // const formData = new FormData();
        // formData.append('file', file);
        // const response = await fetch('/api/v1/verify/upload_document', ...);

        setTimeout(() => {
            onSuccess(`/documents/${file.name}`);
        }, 1500);
    };

    const resetModal = () => {
        setState('idle');
        setFile(null);
        setError(null);
        setAnalysisMessages([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Upload Verification Document
                    </h2>
                    <button
                        onClick={() => { resetModal(); onClose(); }}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {state === 'idle' && (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Verify your {targetType} at <strong>{targetName}</strong>.
                                <br />
                                Accepted: Paystub, Offer Letter, W2, Transcript.
                            </p>

                            {/* Drop Zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                                    ${file
                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                        <span className="text-gray-900 dark:text-white font-medium">
                                            {file.name}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Drag & drop or click to upload
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PDF, JPG, PNG (Max 5MB)
                                        </p>
                                    </>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 mt-4 text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file}
                                className="w-full mt-6 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Upload & Analyze
                            </button>
                        </>
                    )}

                    {(state === 'uploading' || state === 'analyzing') && (
                        <div className="text-center py-8">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-900 dark:text-white font-medium mb-4">
                                {state === 'uploading' ? 'Uploading...' : 'Analyzing Document...'}
                            </p>

                            {/* Analysis Messages */}
                            <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                {analysisMessages.map((msg, i) => (
                                    <p key={i} className="text-sm text-gray-600 dark:text-gray-300">
                                        {msg}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Document Verified!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your {targetType} at {targetName} has been verified.
                            </p>
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="text-center py-8">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Verification Failed
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                We couldn't verify this document. Please try again.
                            </p>
                            <button
                                onClick={resetModal}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
