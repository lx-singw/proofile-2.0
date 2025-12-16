'use client';

import Link from 'next/link';
import { ArrowLeft, Search, Settings, Clock, Target, Globe, Sliders } from 'lucide-react';


export default function HunterAgentPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href="/jobs/agents"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Agents
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                        <Search className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Hunter Agent Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Configure how Hunter discovers opportunities
                        </p>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Target Role */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-500" />
                            Target Roles
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="e.g., Senior Product Manager"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                            />
                            <div className="flex flex-wrap gap-2">
                                {['Product Manager', 'Senior PM', 'Director of Product'].map(role => (
                                    <span key={role} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                                        {role} ×
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sources */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            Job Sources
                        </h3>
                        <div className="space-y-3">
                            {['LinkedIn', 'Indeed', 'Glassdoor', 'AngelList', 'Company Websites'].map(source => (
                                <label key={source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-900 dark:text-white">{source}</span>
                                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            Scan Schedule
                        </h3>
                        <select className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg">
                            <option>Every hour</option>
                            <option>Every 4 hours</option>
                            <option>Once daily</option>
                            <option>Manual only</option>
                        </select>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-green-500" />
                            Match Threshold
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                                    Minimum Match Score: 70%
                                </label>
                                <input type="range" min="50" max="95" defaultValue="70" className="w-full" />
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded text-purple-600" />
                                <span className="text-gray-900 dark:text-white">Only show verified employers</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex gap-3">
                    <button className="flex-1 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700">
                        Save Settings
                    </button>
                    <button className="px-6 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700">
                        Reset
                    </button>
                </div>
            </main>
        </div>
    );
}
