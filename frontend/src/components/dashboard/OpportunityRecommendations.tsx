"use client";

import { useEffect, useState } from 'react';
import { opportunityService, type Opportunity } from '@/services/opportunityService';
import { Briefcase, MapPin, Building2, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function OpportunityRecommendations() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        opportunityService.getRecommendations()
            .then(setOpportunities)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (opportunities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
                <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No opportunity recommendations yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {opportunities.map((opp) => (
                <div
                    key={opp.id}
                    className="group relative p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-emerald-200 dark:hover:border-emerald-800"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                {opp.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <Building2 className="w-3 h-3" />
                                <span>{opp.company_name}</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Match</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{opp.location || 'Remote'}</span>
                        </div>
                        <div className="flex-1" />
                        <Link
                            href={`/portal/${opp.id}`}
                            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                            View Details
                            <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            ))}

            <Link
                href="/opportunities"
                className="block text-center text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors py-2"
            >
                View all matches
            </Link>
        </div>
    );
}
