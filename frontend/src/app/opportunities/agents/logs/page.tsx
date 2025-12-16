'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';


interface LogEntry {
    id: string;
    timestamp: string;
    agent: 'hunter' | 'tailor' | 'negotiator';
    action: string;
    status: 'success' | 'warning' | 'error';
    details?: string;
}

export default function AgentLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: '1', timestamp: '2024-12-14 13:05:32', agent: 'hunter', action: 'Scanned LinkedIn for new postings', status: 'success', details: 'Found 12 new matches' },
        { id: '2', timestamp: '2024-12-14 13:04:15', agent: 'hunter', action: 'Analyzed job at Stripe', status: 'success', details: '92% match score' },
        { id: '3', timestamp: '2024-12-14 13:02:41', agent: 'tailor', action: 'Generated tailored resume', status: 'success', details: 'For: Senior PM at Google' },
        { id: '4', timestamp: '2024-12-14 13:00:00', agent: 'hunter', action: 'Rate limited by Indeed', status: 'warning', details: 'Retrying in 60s' },
        { id: '5', timestamp: '2024-12-14 12:55:22', agent: 'negotiator', action: 'Fetched salary data', status: 'error', details: 'API timeout' },
    ]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-emerald-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    const getAgentColor = (agent: string) => {
        switch (agent) {
            case 'hunter': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'tailor': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
            case 'negotiator': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <Link
                    href="/jobs/agents"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Agents
                </Link>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        Activity Logs
                    </h1>
                    <select className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                        <option>All Agents</option>
                        <option>Hunter</option>
                        <option>Tailor</option>
                        <option>Negotiator</option>
                    </select>
                </div>

                {/* Log Entries */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-start gap-3">
                                    {getStatusIcon(log.status)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAgentColor(log.agent)}`}>
                                                {log.agent}
                                            </span>
                                            <span className="text-xs text-gray-500">{log.timestamp}</span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {log.action}
                                        </p>
                                        {log.details && (
                                            <p className="text-sm text-gray-500 mt-1">{log.details}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
