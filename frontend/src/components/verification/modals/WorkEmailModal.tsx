'use client';

/**
 * Work Email Verification Modal
 * Modal for verifying employment via corporate email OTP
 */

import React, { useState } from 'react';
import { X, Mail, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface WorkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyName?: string;
    jobId?: number;
    onSuccess?: () => void;
}

type Step = 'email' | 'otp' | 'success' | 'error';

export default function WorkEmailModal({
    isOpen,
    onClose,
    companyName,
    jobId,
    onSuccess
}: WorkEmailModalProps) {
    const [step, setStep] = useState<Step>('email');
    const [workEmail, setWorkEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [domain, setDomain] = useState('');

    if (!isOpen) return null;

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/verify/employment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    work_email: workEmail,
                    company_name: companyName,
                    job_id: jobId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to send verification email');
            }

            setVerificationId(data.verification_id);
            setDomain(data.domain);
            setStep('otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/verify/employment/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    verification_id: verificationId,
                    otp_code: otp
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Invalid OTP code');
            }

            setStep('success');
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!verificationId) return;
        setLoading(true);

        try {
            await fetch(`/api/v1/verify/employment/resend-otp?verification_id=${verificationId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setError('');
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('email');
        setWorkEmail('');
        setOtp('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Verify Employment
                            </h3>
                            {companyName && (
                                <p className="text-sm text-gray-500">at {companyName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Work Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={workEmail}
                                        onChange={(e) => setWorkEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Must be a corporate email. Public domains (gmail, yahoo, etc.) are not accepted.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !workEmail}
                                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-5 w-5" />
                                        Send Verification Code
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full inline-block mb-3">
                                    <Mail className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">
                                    We sent a 6-digit code to
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {workEmail}
                                </p>
                                {domain && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Domain: {domain}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full text-center text-2xl tracking-widest py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Verify Code
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                                >
                                    Didn&apos;t receive the code? Resend
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full inline-block mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Employment Verified!
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Your employment at {companyName || domain} has been verified.
                                <br />
                                <span className="text-green-600 font-medium">+15 Trust Points earned!</span>
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
