'use client';

import React from 'react';
import { User, Shield } from 'lucide-react';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Main content */}
            {children}

            {/* Profile Center footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <div className="container mx-auto px-4">
                    {/* Profile Center badge */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Profile Center</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Your Professional Identity</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 text-sm text-gray-500 dark:text-gray-400">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span>Powered by Proofile</span>
                        </div>
                    </div>

                    {/* Info links */}
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>Your profile is secured and you control what's visible.</p>
                        <p className="mt-1">
                            <a href="/privacy" className="underline hover:text-blue-600">Privacy Policy</a>
                            {" · "}
                            <a href="/settings" className="underline hover:text-blue-600">Profile Settings</a>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
