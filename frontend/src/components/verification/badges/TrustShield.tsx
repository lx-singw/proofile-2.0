'use client';

import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

interface TrustShieldProps {
    level: 'L1' | 'L2' | 'L3' | null;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

/**
 * TrustShield - The universal verification badge
 * 
 * Tiers:
 * - L3 (Gold): Identity Verified
 * - L2 (Silver): Employment/Education Verified
 * - L1 (Bronze): Skill/Peer Verified
 */
export default function TrustShield({
    level,
    size = 'md',
    showLabel = false
}: TrustShieldProps) {
    if (!level) return null;

    const sizeMap = {
        sm: { icon: 14, px: 'px-1.5 py-0.5', text: 'text-xs' },
        md: { icon: 16, px: 'px-2 py-1', text: 'text-xs' },
        lg: { icon: 20, px: 'px-3 py-1.5', text: 'text-sm' }
    };

    const tierConfig = {
        L3: {
            label: 'Gold',
            description: 'Identity Verified',
            bgClass: 'bg-gradient-to-r from-emerald-100 to-emerald-200 border-emerald-300',
            textClass: 'text-emerald-800',
            iconClass: 'text-emerald-600'
        },
        L2: {
            label: 'Silver',
            description: 'History Verified',
            bgClass: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300',
            textClass: 'text-slate-700',
            iconClass: 'text-slate-500'
        },
        L1: {
            label: 'Bronze',
            description: 'Skill Verified',
            bgClass: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200',
            textClass: 'text-emerald-700',
            iconClass: 'text-emerald-500'
        }
    };

    const config = tierConfig[level];
    const sz = sizeMap[size];

    return (
        <div
            className={`
                inline-flex items-center gap-1 rounded-full border
                ${config.bgClass} ${sz.px}
            `}
            title={config.description}
        >
            <Shield className={`${config.iconClass}`} size={sz.icon} />
            {showLabel && (
                <span className={`font-semibold ${config.textClass} ${sz.text}`}>
                    {config.label}
                </span>
            )}
            <CheckCircle className="text-green-500" size={sz.icon - 2} />
        </div>
    );
}

/**
 * VerificationTooltip - Shows verification details on hover
 */
export function VerificationTooltip({
    method,
    date,
    provider
}: {
    method: string;
    date: string;
    provider?: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                    Verified by Proofile
                </span>
            </div>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p><strong>Method:</strong> {method}</p>
                <p><strong>Date:</strong> {date}</p>
                {provider && <p><strong>Provider:</strong> {provider}</p>}
            </div>
        </div>
    );
}
