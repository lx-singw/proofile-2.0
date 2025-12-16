"use client";

import React from "react";
import Link from "next/link";
import {
    TrendingUp,
    CheckCircle,
    Star,
    Shield,
    Briefcase,
    Users,
    Award,
    ArrowRight,
    FileText,
    Upload,
    Sparkles,
    RefreshCw,
    Wrench
} from "lucide-react";

interface LiveActivityItem {
    id: string;
    icon: React.ReactNode;
    iconColor: string;
    text: React.ReactNode;
    time: string;
}

const LIVE_ACTIVITY: LiveActivityItem[] = [
    {
        id: "1",
        icon: <CheckCircle className="w-5 h-5" />,
        iconColor: "text-green-500",
        text: <><span className="font-semibold">Sarah Chen</span> just got verified at <span className="font-semibold">Google</span></>,
        time: "2m ago"
    },
    {
        id: "2",
        icon: <Star className="w-5 h-5" />,
        iconColor: "text-yellow-500",
        text: <><span className="font-semibold">Marcus Johnson</span> received 5-star rating from colleague</>,
        time: "5m ago"
    },
    {
        id: "3",
        icon: <Briefcase className="w-5 h-5" />,
        iconColor: "text-blue-500",
        text: <><span className="font-semibold">TechCorp</span> posted <span className="font-semibold">Senior Developer</span> role</>,
        time: "8m ago"
    },
    {
        id: "4",
        icon: <Shield className="w-5 h-5" />,
        iconColor: "text-purple-500",
        text: <><span className="font-semibold">Alex Rivera</span> completed skills verification</>,
        time: "12m ago"
    },
    {
        id: "5",
        icon: <Users className="w-5 h-5" />,
        iconColor: "text-blue-500",
        text: <><span className="font-semibold">3 new companies</span> joined Proofile</>,
        time: "15m ago"
    },
    {
        id: "6",
        icon: <CheckCircle className="w-5 h-5" />,
        iconColor: "text-green-500",
        text: <><span className="font-semibold">Emma Davis</span> verified work history at <span className="font-semibold">Microsoft</span></>,
        time: "18m ago"
    },
];

export default function HomeLeftSidebar() {
    return (
        <aside className="w-full lg:w-72 space-y-4">
            {/* Resume Tools Widget */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Resume Tools</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">3 Tools</span>
                </div>
                <div className="space-y-2 mb-3">
                    <Link href="/resume/build" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Generate from Profile</span>
                    </Link>
                    <Link href="/resume/upload" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
                        <Upload className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload & Analyze</span>
                    </Link>
                    <Link href="/resume/ai-build" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors group">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">AI Build Resume</span>
                    </Link>
                </div>
                <Link
                    href="/tools"
                    className="flex items-center justify-center gap-1 w-full px-3 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-xs"
                >
                    <Wrench className="w-3 h-3" />
                    View All Tools
                </Link>
            </div>

            {/* Live Platform Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Live Activity</h3>
                    </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {LIVE_ACTIVITY.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                            <span className={`flex-shrink-0 ${item.iconColor}`}>{item.icon}</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">
                                {item.text}
                            </p>
                            <span className="text-xs text-gray-500 flex-shrink-0">{item.time}</span>
                        </div>
                    ))}
                </div>
                <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Join <span className="font-bold text-green-600 dark:text-green-400">10,000+</span> professionals
                    </p>
                </div>
            </div>

            {/* For Talent Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">For Talent</h3>
                </div>
                <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">Build verified professional profile</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">Get peer ratings from colleagues</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">AI-powered job matching</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">Control your visibility</span>
                    </li>
                </ul>
                <Link
                    href="/register"
                    className="block w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-center text-sm"
                >
                    Sign up free
                </Link>
            </div>

            {/* For Recruiters Card */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">For Recruiters</h3>
                </div>
                <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">Search verified talent pool</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">See real peer reviews</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">AI candidate matching</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">Pay per hire model</span>
                    </li>
                </ul>
                <Link
                    href="/register"
                    className="block w-full px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center text-sm border border-gray-200 dark:border-gray-600"
                >
                    Start recruiting
                </Link>
            </div>
        </aside>
    );
}
