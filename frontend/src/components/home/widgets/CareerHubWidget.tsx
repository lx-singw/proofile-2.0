"use client";

import React from "react";
import Link from "next/link";
import { Wrench, Briefcase, GraduationCap } from "lucide-react";

export default function CareerHubWidget() {
    return (
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-teal-200/50 dark:border-teal-800/30 p-4 overflow-hidden shadow-lg shadow-teal-500/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />
            <div className="flex items-center justify-between mb-3 pt-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Career Hub</h3>
                </div>
            </div>
            <div className="space-y-2 mb-3">
                <Link href="/portal" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Job Matching</span>
                </Link>
                <Link href="/verification" className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors group">
                    <GraduationCap className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Get Verified</span>
                </Link>
            </div>
            <Link
                href="/portal"
                className="flex items-center justify-center gap-1 w-full px-3 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors text-xs"
            >
                Explore Portal
            </Link>
        </div>
    );
}
