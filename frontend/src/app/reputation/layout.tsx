'use client';

/**
 * Reputation Layout - Shared layout for reputation pages
 * 
 * Provides consistent footer for:
 * - /reputation (dashboard)
 * - /reputation/request (request ratings)
 * - /reputation/[id]/public (public profile)
 */

import React from 'react';
import { Star, Shield } from 'lucide-react';

interface ReputationLayoutProps {
    children: React.ReactNode;
}

export default function ReputationLayout({ children }: ReputationLayoutProps) {
    return (
        <>
            {/* Main content - no wrapper to avoid conflicts with AppShell */}
            {children}

            {/* Trust footer at bottom */}
            <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <div className="container mx-auto px-4">
                    {/* Reputation Center badge */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                            <Star className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Reputation Center</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Professional Trust Network</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 text-sm text-gray-500 dark:text-gray-400">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span>Powered by Proofile</span>
                        </div>
                    </div>

                    {/* Info links */}
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>Your ratings are verified and cryptographically secured.</p>
                        <p className="mt-1">
                            <a href="/privacy" className="underline hover:text-emerald-600">Privacy Policy</a>
                            {" · "}
                            <a href="/reputation/how-it-works" className="underline hover:text-emerald-600">How It Works</a>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
