"use client";

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    X,
    Copy,
    Check,
    Mail,
    MessageCircle,
    Linkedin,
    Twitter,
    Download,
    Share2,
    ExternalLink,
    Lightbulb,
    QrCode
} from "lucide-react";
import { toast } from "@/lib/toast";

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    fullName?: string;
    headline?: string;
}

export function ShareProfileModal({
    isOpen,
    onClose,
    username,
    fullName,
    headline
}: ShareProfileModalProps) {
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://proofile.co'}/p/${username}`;
    const shortUrl = `proofile.co/p/${username}`;
    const shareText = fullName
        ? `Check out ${fullName}'s professional profile on Proofile`
        : `Check out this professional profile on Proofile`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 300;
            canvas.height = 300;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 300, 300);
                ctx.drawImage(img, 25, 25, 250, 250);
            }
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `proofile-${username}-qr.png`;
            downloadLink.click();
            toast.success("QR code downloaded!");
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const shareLinks = [
        {
            name: "Email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            href: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(profileUrl)}`
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-green-600 hover:bg-green-700",
            href: `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${profileUrl}`)}`
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            color: "bg-blue-700 hover:bg-blue-800",
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`
        },
        {
            name: "Twitter",
            icon: Twitter,
            color: "bg-sky-500 hover:bg-sky-600",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
        }
    ];

    const proTips = [
        "Add your QR code to your email signature",
        "Print it on your business cards",
        "Use it on conference name tags",
        "Add it to your LinkedIn banner"
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Your Profile</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Let others discover you</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* QR Code Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-center mb-4">
                            <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-lg">
                                <QRCodeSVG
                                    value={profileUrl}
                                    size={180}
                                    level="M"
                                    includeMargin={false}
                                    fgColor="#1f2937"
                                />
                            </div>
                        </div>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Scan to view profile
                        </p>
                        <button
                            onClick={handleDownloadQR}
                            className="w-full py-2.5 bg-gray-900 dark:bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download QR Code
                        </button>
                    </div>

                    {/* Short Link Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Profile Link
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm truncate">
                                    {shortUrl}
                                </span>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className={`p-3 rounded-xl font-medium transition-all flex items-center gap-2 ${copied
                                        ? "bg-green-600 text-white"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Share via
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {shareLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-colors ${link.color}`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{link.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Pro Tips */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <span className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Pro Tips</span>
                        </div>
                        <ul className="space-y-2">
                            {proTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                                    <span>•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
