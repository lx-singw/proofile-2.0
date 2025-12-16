'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Search, FileEdit, DollarSign, Settings, ChevronRight, Play, Pause, Clock } from 'lucide-react';


export default function AgentsPage() {
    const [agents, setAgents] = useState([
        {
            id: 'hunter',
            name: 'Hunter Agent',
            description: 'Discovers job opportunities matching your profile',
            status: 'active',
            icon: Search,
            stats: { found: 142, qualified: 38 },
            lastRun: '2 mins ago'
        },
        {
            id: 'tailor',
            name: 'Tailor Agent',
            description: 'Customizes your resume for each application',
            status: 'idle',
            icon: FileEdit,
            stats: { tailored: 12, pending: 3 },
            lastRun: '1 hour ago'
        },
        {
            id: 'negotiator',
            name: 'Negotiator Agent',
            description: 'Provides salary insights and negotiation tips',
            status: 'paused',
            icon: DollarSign,
            stats: { insights: 5, saved: '$15k' },
            lastRun: 'Never'
        },
    ]);

    const toggleAgent = (id: string) => {
        setAgents(agents.map(agent =>
            agent.id === id
                ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
                : agent
        ));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Zap className="w-8 h-8 text-emerald-500" />
                            AI Agents
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Configure your autonomous career assistants
                        </p>
                    </div>
                    <Link
                        href="/jobs/agents/logs"
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Clock className="w-4 h-4" />
                        View Logs
                    </Link>
                </div>

                {/* Agents Grid */}
                <div className="space-y-4">
                    {agents.map((agent) => {
                        const Icon = agent.icon;
                        return (
                            <div
                                key={agent.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            p-3 rounded-xl
                                            ${agent.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' :
                                                agent.status === 'paused' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                    'bg-gray-100 dark:bg-gray-700'}
                                        `}>
                                            <Icon className={`w-6 h-6 
                                                ${agent.status === 'active' ? 'text-green-600' :
                                                    agent.status === 'paused' ? 'text-emerald-600' :
                                                        'text-gray-500'}
                                            `} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {agent.name}
                                                </h3>
                                                <span className={`
                                                    px-2 py-0.5 text-xs font-medium rounded-full
                                                    ${agent.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        agent.status === 'paused' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}
                                                `}>
                                                    {agent.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                {agent.description}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                {Object.entries(agent.stats).map(([key, value]) => (
                                                    <span key={key}>
                                                        <strong className="text-gray-900 dark:text-white">{value}</strong> {key}
                                                    </span>
                                                ))}
                                                <span>• Last run: {agent.lastRun}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAgent(agent.id)}
                                            className={`
                                                p-2 rounded-lg transition-colors
                                                ${agent.status === 'active'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200'
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'}
                                            `}
                                        >
                                            {agent.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </button>
                                        <Link
                                            href={`/jobs/agents/${agent.id}`}
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
