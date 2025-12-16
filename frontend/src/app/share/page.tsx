"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import {
    ArrowLeft,
    Copy,
    Check,
    Mail,
    MessageCircle,
    Linkedin,
    Twitter,
    Download,
    ExternalLink,
    Lightbulb,
    QrCode,
    Eye,
    Share2,
    Printer
} from "lucide-react";

export default function SharePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://proofile.co'}/p/${user.username}`;
    const shortUrl = `proofile.co/p/${user.username}`;
    const shareText = `Check out ${user.full_name || user.username}'s professional profile on Proofile`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            toast.success("Link copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleDownloadQR = () => {
        const svg = document.querySelector('#main-qr svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 400;
            canvas.height = 400;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 400, 400);
                ctx.drawImage(img, 25, 25, 350, 350);
            }
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `proofile-${user.username}-qr.png`;
            downloadLink.click();
            toast.success("QR code downloaded!");
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const handlePrint = () => {
        window.print();
    };

    const shareLinks = [
        {
            name: "Email",
            icon: Mail,
            color: "bg-gray-700 hover:bg-gray-800",
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
            name: "Twitter/X",
            icon: Twitter,
            color: "bg-gray-900 hover:bg-black",
            href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 print:bg-white">
            <div className="print:hidden">
                
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/profile"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                    <Share2 className="w-6 h-6 text-white" />
                                </div>
                                Share Your Proofile
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Let others discover your professional identity
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/p/${user.username}`}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* QR Code Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your QR Code</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Scan with any phone camera to view your profile
                            </p>
                        </div>

                        <div id="main-qr" className="flex justify-center mb-6">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                                <QRCodeSVG
                                    value={profileUrl}
                                    size={220}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#1f2937"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDownloadQR}
                                className="w-full py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download QR Code
                            </button>
                            <button
                                onClick={handlePrint}
                                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                Print
                            </button>
                        </div>
                    </div>

                    {/* Share Options Card */}
                    <div className="space-y-6">
                        {/* Short Link */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your Profile Link</h3>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300 font-mono text-sm truncate">
                                        {shortUrl}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${copied
                                            ? "bg-green-600 text-white"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Share via</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {shareLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-colors ${link.color}`}
                                    >
                                        <link.icon className="w-5 h-5" />
                                        {link.name}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Pro Tips */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <span className="font-bold text-yellow-800 dark:text-yellow-300">Pro Tips</span>
                            </div>
                            <ul className="space-y-3 text-sm text-yellow-700 dark:text-yellow-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">✓</span>
                                    Add your QR code to your email signature
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">✓</span>
                                    Print it on your business cards
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">✓</span>
                                    Use it on conference name tags
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500">✓</span>
                                    Add it to your LinkedIn banner image
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:bg-white {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
