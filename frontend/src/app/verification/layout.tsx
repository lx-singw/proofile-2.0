"use client";

import React from "react";

export default function VerificationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Main content - no wrapper to avoid conflicts with AppShell */}
            {children}

            {/* Trust footer at bottom */}
            <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 mt-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4">
                    {/* Trust Center badge */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">Trust Center</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Secure Verification Portal</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 text-sm text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Secured by Proofile</span>
                        </div>
                    </div>

                    {/* Privacy links */}
                    <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                        <p>Your data is encrypted and never shared without your consent.</p>
                        <p className="mt-1">
                            <a href="/privacy" className="underline hover:text-emerald-600">Privacy Policy</a>
                            {" · "}
                            <a href="/security" className="underline hover:text-emerald-600">Security</a>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
