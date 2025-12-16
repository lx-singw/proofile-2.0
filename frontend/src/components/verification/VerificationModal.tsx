"use client";

import React, { useState } from "react";
import { X, Mail, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import verificationService from "../../services/verificationService";

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "email" | "phone";
    onSuccess: () => void;
    initialValue?: string;
}

export function VerificationModal({
    isOpen,
    onClose,
    type,
    onSuccess,
    initialValue = "",
}: VerificationModalProps) {
    const [step, setStep] = useState<"initiate" | "confirm">("initiate");
    const [value, setValue] = useState(initialValue);
    const [token, setToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debugToken, setDebugToken] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (type === "email") {
                const res = await verificationService.initiateEmailVerification(value);
                if (res.debug_token) {
                    setDebugToken(res.debug_token); // For demo
                }
                setStep("confirm");
            }
            // TODO: Phone support
        } catch (err: any) {
            setError(err.message || "Failed to initiate verification");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (type === "email") {
                await verificationService.confirmEmailVerification(token);
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Invalid token");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Verify your {type === "email" ? "Email" : "Phone"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {step === "initiate"
                            ? "We'll send you a verification code."
                            : `Enter the code sent to ${value}`}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {debugToken && step === "confirm" && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs rounded-lg break-all">
                        Development Mode: Code is <b>{debugToken}</b>
                    </div>
                )}

                {step === "initiate" ? (
                    <form onSubmit={handleInitiate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {type === "email" ? "Email Address" : "Phone Number"}
                            </label>
                            <input
                                type={type}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder={type === "email" ? "you@example.com" : "+1 555 000 0000"}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !value}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Send Code <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Enter Verification Code
                            </label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center tracking-widest font-mono text-lg"
                                placeholder="Enter code"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !token}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Verify <CheckCircle className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep("initiate")}
                            className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            Start over
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
