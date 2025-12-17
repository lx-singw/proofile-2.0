"use client";

import React from "react";
import Link from "next/link";
import {
    Trophy,
    Building2,
    DollarSign,
    Star,
    ArrowRight,
    Sparkles,
    Briefcase,
    GraduationCap,
    Award,
    Wrench
} from "lucide-react";

interface SkillLeaderboardItem {
    rank: number;
    skill: string;
    professionals: number;
    avgRating: number;
}

interface CompanyHiring {
    id: string;
    name: string;
    logo: string;
    openRoles: number;
    color: string;
}

interface SalaryInsight {
    role: string;
    range: string;
    verifiedProfiles: number;
}

const SKILLS_LEADERBOARD: SkillLeaderboardItem[] = [
    { rank: 1, skill: "React Development", professionals: 127, avgRating: 4.8 },
    { rank: 2, skill: "Python/ML", professionals: 98, avgRating: 4.9 },
    { rank: 3, skill: "Product Design", professionals: 84, avgRating: 4.7 },
];

const COMPANIES_HIRING: CompanyHiring[] = [
    { id: "1", name: "Google", logo: "G", openRoles: 12, color: "from-emerald-500 to-emerald-600" },
    { id: "2", name: "Stripe", logo: "S", openRoles: 8, color: "from-emerald-500 to-emerald-600" },
    { id: "3", name: "Airbnb", logo: "A", openRoles: 15, color: "from-pink-500 to-red-500" },
    { id: "4", name: "Shopify", logo: "S", openRoles: 6, color: "from-green-500 to-green-600" },
];

const SALARY_INSIGHTS: SalaryInsight[] = [
    { role: "Senior Software Engineer", range: "$140k - $220k", verifiedProfiles: 234 },
    { role: "Product Manager", range: "$120k - $180k", verifiedProfiles: 156 },
    { role: "UX Designer", range: "$100k - $150k", verifiedProfiles: 89 },
];

export default function HomeRightSidebar() {
    return (
        <aside className="w-full lg:w-80 space-y-4">
            {/* Career Tools Widget */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-teal-200/50 dark:border-teal-800/30 p-4 overflow-hidden shadow-lg shadow-teal-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
                <div className="flex items-center justify-between mb-3 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Career Tools</h3>
                    </div>
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-500 px-2 py-0.5 rounded-full">3 Tools</span>
                </div>
                <div className="space-y-2 mb-3">
                    <Link href="/jobs" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Job Matching</span>
                    </Link>
                    <Link href="/dashboard/verification" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group">
                        <GraduationCap className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Skills Assessment</span>
                    </Link>
                    <Link href="/dashboard/verification" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Get Verified</span>
                    </Link>
                </div>
                <Link
                    href="/tools"
                    className="flex items-center justify-center gap-1 w-full px-3 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors text-xs"
                >
                    <Wrench className="w-3 h-3" />
                    Explore All Tools
                </Link>
            </div>

            {/* Skills Leaderboard */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 overflow-hidden shadow-lg shadow-amber-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500" />
                <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                            <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Top Rated Skills</h3>
                    </div>
                    <Link href="/skills" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                        See all
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="space-y-3">
                    {SKILLS_LEADERBOARD.map((skill) => (
                        <div
                            key={skill.rank}
                            className={`bg-white dark:bg-gray-900 rounded-xl p-3 border ${skill.rank === 1
                                ? "border-emerald-200 dark:border-emerald-700"
                                : "border-gray-200 dark:border-gray-700"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-lg font-bold ${skill.rank === 1
                                    ? "text-emerald-600 dark:text-emerald-500"
                                    : "text-gray-500"
                                    }`}>
                                    #{skill.rank}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">
                                    {skill.skill}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {skill.professionals} verified professionals
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {skill.avgRating}
                                </span>
                                <span className="text-xs text-gray-500">avg rating</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Companies Hiring */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 p-4 overflow-hidden shadow-lg shadow-indigo-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Actively Hiring</h3>
                    </div>
                    <Link href="/companies" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                        View all
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="space-y-2">
                    {COMPANIES_HIRING.map((company, index) => (
                        <div
                            key={company.id}
                            className={`bg-white dark:bg-gray-900 rounded-xl p-3 border transition-colors cursor-pointer ${index % 2 === 0
                                ? "border-emerald-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500"
                                : "border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 bg-gradient-to-br ${company.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                                        {company.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{company.name}</p>
                                        <p className={`text-xs font-semibold ${index % 2 === 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-emerald-600 dark:text-emerald-400"
                                            }`}>
                                            {company.openRoles} open roles
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Salary Insights */}
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-800/30 p-4 overflow-hidden shadow-lg shadow-green-500/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30">
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Salary Insights</h3>
                    </div>
                    <Link href="/salaries" className="text-xs font-semibold text-green-600 hover:text-green-700 dark:text-green-400 flex items-center gap-1">
                        Explore
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="space-y-3">
                    {SALARY_INSIGHTS.map((insight, index) => (
                        <div
                            key={insight.role}
                            className={`bg-white dark:bg-gray-900 rounded-xl p-3 border ${index === 0
                                ? "border-green-200 dark:border-gray-700"
                                : "border-gray-200 dark:border-gray-700"
                                }`}
                        >
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                                {insight.role}
                            </h4>
                            <p className="text-lg font-bold text-green-600 dark:text-green-500 mb-1">
                                {insight.range}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Based on {insight.verifiedProfiles} verified profiles
                            </p>
                        </div>
                    ))}
                </div>
            </div>


            {/* Get Started CTA */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold">Ready to get started?</h3>
                </div>
                <p className="text-sm text-green-50 mb-4">
                    Create your verified profile and get matched with opportunities.
                </p>
                <Link
                    href="/start"
                    className="block w-full px-4 py-2.5 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors text-center text-sm"
                >
                    Create Free Profile
                </Link>
            </div>
        </aside>
    );
}
