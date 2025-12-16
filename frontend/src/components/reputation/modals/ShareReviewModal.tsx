'use client';

/**
 * ShareReviewModal - Generate shareable review cards
 * 
 * Creates beautiful share images for LinkedIn, Twitter, etc.
 */

import React, { useState, useRef } from 'react';
import { X, Download, Copy, Share2, Linkedin, Twitter, CheckCircle } from 'lucide-react';

interface ShareReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    review: {
        author: string;
        role: string;
        text: string;
        rating: number;
        date: string;
    };
    recipientName: string;
}

export default function ShareReviewModal({
    isOpen,
    onClose,
    review,
    recipientName,
}: ShareReviewModalProps) {
    const [copied, setCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const shareText = `"${review.text.slice(0, 200)}${review.text.length > 200 ? '...' : ''}" - ${review.author}, ${review.role}

Check out my verified professional reputation on Proofile!`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToLinkedIn = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(shareText);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent(shareText);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Share2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            Share This Review
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Preview Card */}
                <div className="p-6">
                    <div
                        ref={cardRef}
                        className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white mb-6"
                    >
                        {/* Stars */}
                        <div className="flex gap-1 mb-4">
                            {Array(5).fill(0).map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-6 h-6 ${i < review.rating ? 'text-yellow-400' : 'text-white/30'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>

                        {/* Quote */}
                        <p className="text-lg font-medium mb-4 leading-relaxed">
                            "{review.text.slice(0, 150)}{review.text.length > 150 ? '...' : ''}"
                        </p>

                        {/* Author */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{review.author}</p>
                                <p className="text-sm text-white/80">{review.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">About {recipientName}</p>
                                <p className="text-xs text-white/80">on Proofile</p>
                            </div>
                        </div>
                    </div>

                    {/* Share Options */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <button
                            onClick={shareToLinkedIn}
                            className="flex flex-col items-center gap-2 p-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl transition-colors"
                        >
                            <Linkedin className="h-6 w-6" />
                            <span className="text-sm font-medium">LinkedIn</span>
                        </button>
                        <button
                            onClick={shareToTwitter}
                            className="flex flex-col items-center gap-2 p-4 bg-black hover:bg-gray-800 text-white rounded-xl transition-colors"
                        >
                            <Twitter className="h-6 w-6" />
                            <span className="text-sm font-medium">Twitter</span>
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="flex flex-col items-center gap-2 p-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                        >
                            {copied ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                            <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Share your professional endorsement with your network
                    </p>
                </div>
            </div>
        </div>
    );
}
