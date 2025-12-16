'use client';

import React from 'react';
import { Search, Shield } from 'lucide-react';

export default function DiscoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
            <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Search className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Discover Center</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Find Your Next Connection</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 text-sm text-gray-500 dark:text-gray-400">
                            <Shield className="w-4 h-4 text-purple-500" />
                            <span>Powered by Proofile</span>
                        </div>
                    </div>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>Connect with verified professionals that match your interests.</p>
                        <p className="mt-1">
                            <a href="/privacy" className="underline hover:text-purple-600">Privacy Policy</a>
                            {" · "}
                            <a href="/explore" className="underline hover:text-purple-600">Explore More</a>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
