'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

interface HunterLogStreamProps {
    isLive?: boolean;
}

/**
 * HunterLogStream - Live terminal-like log display
 */
export default function HunterLogStream({ isLive = true }: HunterLogStreamProps) {
    const [logs, setLogs] = useState<LogEntry[]>([
        { timestamp: '13:05:32', message: 'Initializing job scan...', type: 'info' },
        { timestamp: '13:05:33', message: 'Connected to LinkedIn API', type: 'success' },
        { timestamp: '13:05:35', message: 'Scanning for: Senior Product Manager', type: 'info' },
        { timestamp: '13:05:38', message: 'Found 12 new postings', type: 'success' },
        { timestamp: '13:05:40', message: 'Analyzing match scores...', type: 'info' },
    ]);

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            const newLogs: LogEntry[] = [
                { timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), message: 'Processing job #' + Math.floor(Math.random() * 1000), type: 'info' },
                { timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), message: 'Match found: 87% at Stripe', type: 'success' },
            ];
            setLogs(prev => [...prev.slice(-8), newLogs[Math.floor(Math.random() * 2)]]);
        }, 3000);

        return () => clearInterval(interval);
    }, [isLive]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-3 h-3 text-emerald-500" />;
            case 'error': return <AlertTriangle className="w-3 h-3 text-red-500" />;
            default: return <span className="w-3 h-3 text-emerald-500">›</span>;
        }
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-white">Hunter Agent Logs</span>
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Live
                    </div>
                )}
            </div>

            <div className="p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="text-gray-500">[{log.timestamp}]</span>
                        {getIcon(log.type)}
                        <span className={`
                            ${log.type === 'success' ? 'text-green-400' :
                                log.type === 'warning' ? 'text-emerald-400' :
                                    log.type === 'error' ? 'text-red-400' :
                                        'text-gray-300'}
                        `}>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
