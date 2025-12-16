'use client';

import React from 'react';
import { Clock, CheckCircle, Loader2, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type ApplicationStatus = 'pending' | 'submitted' | 'viewed' | 'interviewing' | 'rejected' | 'offered';

interface ApplicationCardProps {
    id: number;
    jobId: number;
    company: string;
    title: string;
    status: ApplicationStatus;
    appliedDate: string;
    lastUpdate?: string;
}

/**
 * ApplicationCard - Tracks application state
 */
export default function ApplicationCard({
    id,
    jobId,
    company,
    title,
    status,
    appliedDate,
    lastUpdate
}: ApplicationCardProps) {
    const getStatusConfig = (status: ApplicationStatus) => {
        switch (status) {
            case 'pending':
                return { icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Pending' };
            case 'submitted':
                return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Submitted' };
            case 'viewed':
                return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Viewed by Recruiter' };
            case 'interviewing':
                return { icon: Loader2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Interviewing' };
            case 'rejected':
                return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Not Selected' };
            case 'offered':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Offer Received!' };
            default:
                return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: status };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">{company}</p>
                </div>
                <Link
                    href={`/jobs/${jobId}`}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color} ${status === 'interviewing' ? 'animate-spin' : ''}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                </div>
                <div className="text-xs text-gray-500">
                    Applied: {appliedDate}
                    {lastUpdate && <span> • Updated: {lastUpdate}</span>}
                </div>
            </div>
        </div>
    );
}
