'use client';

import { TrendingUp, DollarSign, MapPin, Briefcase, BarChart2, Users } from 'lucide-react';


export default function MarketIntelPage() {
    const salaryData = {
        role: 'Senior Product Manager',
        location: 'San Francisco Bay Area',
        range: { min: 160000, max: 240000, median: 195000 },
        percentile: 75
    };

    const demandTrends = [
        { skill: 'AI/ML', demand: 92, change: '+15%' },
        { skill: 'Product Strategy', demand: 88, change: '+8%' },
        { skill: 'B2B SaaS', demand: 85, change: '+5%' },
        { skill: 'Data Analytics', demand: 78, change: '+12%' },
        { skill: 'Agile/Scrum', demand: 72, change: '-3%' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <BarChart2 className="w-8 h-8 text-emerald-500" />
                        Market Intelligence
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Real-time salary and demand data for your target roles
                    </p>
                </div>

                {/* Salary Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        Salary Insights
                    </h2>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                        <Briefcase className="w-4 h-4" />
                        <span>{salaryData.role}</span>
                        <span>•</span>
                        <MapPin className="w-4 h-4" />
                        <span>{salaryData.location}</span>
                    </div>

                    {/* Salary Range Visualization */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>${(salaryData.range.min / 1000).toFixed(0)}k</span>
                            <span className="font-bold text-green-600">${(salaryData.range.median / 1000).toFixed(0)}k median</span>
                            <span>${(salaryData.range.max / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden relative">
                            <div
                                className="absolute h-full bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500"
                                style={{ width: '100%' }}
                            />
                            <div
                                className="absolute h-full w-1 bg-white border-2 border-green-600"
                                style={{ left: `${salaryData.percentile}%` }}
                            />
                        </div>
                        <div className="text-center mt-4">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                Top {100 - salaryData.percentile}%
                            </span>
                            <p className="text-sm text-gray-500">
                                Your target is in the top quarter of market rates
                            </p>
                        </div>
                    </div>
                </div>

                {/* Skill Demand */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Skill Demand Trends
                    </h2>

                    <div className="space-y-4">
                        {demandTrends.map((skill, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="w-32 text-gray-700 dark:text-gray-300 font-medium">
                                    {skill.skill}
                                </span>
                                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-500"
                                        style={{ width: `${skill.demand}%` }}
                                    />
                                </div>
                                <span className={`w-16 text-sm font-medium ${skill.change.startsWith('+') ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {skill.change}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
