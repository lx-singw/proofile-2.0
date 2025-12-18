"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    X,
    Send,
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Wand2
} from "lucide-react";

interface DraftMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend?: (message: string) => Promise<void>;
    recipientName: string;
    contextType: "congratulations" | "introduction" | "follow_up" | "thank_you";
    contextDetails?: string;
    initialDraft?: string;
}

const DRAFT_TEMPLATES: Record<string, string[]> = {
    congratulations: [
        "Congratulations on your achievement! 🎉 This is well-deserved recognition of your hard work and expertise.",
        "Amazing news! 🌟 Your dedication really paid off. Wishing you continued success on your journey!",
        "What a milestone! 👏 This speaks volumes about your skills and commitment. Congrats!",
    ],
    introduction: [
        "Hi! I noticed we share similar professional interests and I'd love to connect and learn from your experience.",
        "Hello! I've been following your work and would love to connect. I think we could have some great conversations.",
        "Hi there! Your background really stood out to me. I'd be honored to add you to my professional network.",
    ],
    follow_up: [
        "Thanks for connecting! I really enjoyed our conversation and would love to stay in touch.",
        "Great speaking with you! Let's definitely continue our discussion soon.",
        "Thanks for taking the time to chat. I found our conversation really insightful.",
    ],
    thank_you: [
        "Thank you so much for your help and guidance! It really made a difference.",
        "I truly appreciate your support. Your advice was incredibly valuable.",
        "Just wanted to say thanks for everything. Your mentorship means a lot to me.",
    ],
};

export function DraftMessageModal({
    isOpen,
    onClose,
    onSend,
    recipientName,
    contextType,
    contextDetails,
    initialDraft,
}: DraftMessageModalProps) {
    const [message, setMessage] = useState(initialDraft || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [templateIndex, setTemplateIndex] = useState(0);

    // Update message when initialDraft changes
    useEffect(() => {
        if (initialDraft) {
            setMessage(initialDraft);
        }
    }, [initialDraft]);

    // Generate initial draft on open if no initialDraft provided
    useEffect(() => {
        if (isOpen && !message && !initialDraft) {
            generateDraft();
        }
    }, [isOpen]);

    const generateDraft = async () => {
        setIsGenerating(true);
        // Simulate AI generation
        await new Promise(r => setTimeout(r, 800));

        const templates = DRAFT_TEMPLATES[contextType] || DRAFT_TEMPLATES.congratulations;
        const newIndex = (templateIndex + 1) % templates.length;
        setTemplateIndex(newIndex);
        setMessage(templates[newIndex].replace("{name}", recipientName));
        setIsGenerating(false);
    };

    const handleSend = async () => {
        if (!message.trim() || !onSend) return;

        setIsSending(true);
        try {
            await onSend(message);
            onClose();
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                AI Draft Message
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                To: {recipientName}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="rounded-full h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Context Badge */}
                {contextDetails && (
                    <div className="px-4 pt-3">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                <Wand2 className="w-3 h-3 inline mr-1" />
                                Context: {contextDetails}
                            </p>
                        </div>
                    </div>
                )}

                {/* Message Editor */}
                <div className="p-4">
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Your message..."
                            rows={5}
                            disabled={isGenerating}
                            className="w-full resize-none bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
                        />

                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-700/80 rounded-xl">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-medium">Generating...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Regenerate Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateDraft}
                        disabled={isGenerating}
                        className="mt-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                    >
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isGenerating ? "animate-spin" : ""}`} />
                        Regenerate
                    </Button>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="rounded-lg"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-1.5 text-green-600" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-1.5" />
                                Copy
                            </>
                        )}
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSend}
                            disabled={!message.trim() || isSending}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-lg px-4"
                        >
                            {isSending ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Send className="w-4 h-4" />
                                    Send
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
