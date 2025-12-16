'use client';

import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

interface VerifiedToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

/**
 * VerifiedToggle - "Verified Employers Only" filter
 */
export default function VerifiedToggle({ enabled, onChange }: VerifiedToggleProps) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                ${enabled
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}
            `}
        >
            <Shield className={`w-4 h-4 ${enabled ? 'text-green-500' : ''}`} />
            <span className="text-sm font-medium">Verified Employers Only</span>
            {enabled && <CheckCircle className="w-4 h-4 text-green-500" />}
        </button>
    );
}
