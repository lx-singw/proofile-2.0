"use client";

import React from "react";
import Link from "next/link";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { portalService } from "@/services/portalService";

export default function TopCompaniesWidget() {
    const [hiringCompanies, setHiringCompanies] = React.useState<{ name: string; jobs_count: number }[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const companiesRes = await portalService.getHiringCompanies(4);
                setHiringCompanies(companiesRes);
            } catch (error) {
                console.error("Failed to fetch top companies:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getRandomColor = (index: number) => {
        const colors = [
            "from-emerald-500 to-teal-500",
            "from-blue-500 to-indigo-500",
            "from-purple-500 to-pink-500",
            "from-amber-500 to-orange-500"
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 p-4 overflow-hidden shadow-lg shadow-indigo-500/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="flex items-center justify-between mb-4 pt-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                        <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Top Companies</h3>
                </div>
            </div>
            <div className="space-y-2">
                {loading ? (
                    <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                ) : hiringCompanies.map((company, index) => (
                    <Link
                        href={`/portal?q=${encodeURIComponent(company.name)}`}
                        key={company.name}
                        className="block bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-emerald-400 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 bg-gradient-to-br ${getRandomColor(index)} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                                    {company.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{company.name}</p>
                                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {company.jobs_count} open roles
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
