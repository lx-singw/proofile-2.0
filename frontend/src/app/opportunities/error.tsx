'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function JobsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {error.message || 'Failed to load job recommendations'}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                </button>
            </div>
        </main>
    );
}
