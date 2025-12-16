'use client';

import React from 'react';
import { Zap, Search, FileEdit, DollarSign, Pause, Play } from 'lucide-react';

interface AgentStatus {
    name: 'hunter' | 'tailor' | 'negotiator';
    status: 'active' | 'idle' | 'paused';
    message?: string;
    count?: number;
}

interface AgentStatusWidgetProps {
    agents: AgentStatus[];
    onToggle?: (name: string) => void;
}

/**
 * AgentStatusWidget - Persistent sidebar showing AI agent states
 * 
 * Based on job_matching_ai_plan.md Section 4.1 "Agent Status Bar"
 */
export default function AgentStatusWidget({ agents, onToggle }: AgentStatusWidgetProps) {
    const getAgentConfig = (name: string) => {
        switch (name) {
            case 'hunter':
                return {
                    icon: Search,
                    label: 'Hunter',
                    color: 'text-green-500',
                    bgColor: 'bg-green-100 dark:bg-green-900/30'
                };
            case 'tailor':
                return {
                    icon: FileEdit,
                    label: 'Tailor',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
                };
            case 'negotiator':
                return {
                    icon: DollarSign,
                    label: 'Negotiator',
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
                };
            default:
                return {
                    icon: Zap,
                    label: name,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-100 dark:bg-gray-900/30'
                };
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />;
            case 'paused':
                return <span className="w-2 h-2 rounded-full bg-yellow-500" />;
            default:
                return <span className="w-2 h-2 rounded-full bg-gray-400" />;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                AI Agents
            </h3>

            <div className="space-y-3">
                {agents.map((agent) => {
                    const config = getAgentConfig(agent.name);
                    const Icon = config.icon;

                    return (
                        <div
                            key={agent.name}
                            className={`
                                flex items-center justify-between p-3 rounded-lg
                                ${config.bgColor}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className={config.color} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {config.label}
                                        </span>
                                        {getStatusIndicator(agent.status)}
                                    </div>
                                    {agent.message && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {agent.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {onToggle && (
                                <button
                                    onClick={() => onToggle(agent.name)}
                                    className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                                >
                                    {agent.status === 'paused' ? (
                                        <Play size={14} className="text-gray-600 dark:text-gray-400" />
                                    ) : (
                                        <Pause size={14} className="text-gray-600 dark:text-gray-400" />
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
