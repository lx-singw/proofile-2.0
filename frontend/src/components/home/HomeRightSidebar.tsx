"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NetworkSuggestions } from "./NetworkSuggestions";
import useAuth from "@/hooks/useAuth";
import CareerHubWidget from "./widgets/CareerHubWidget";
import TopTalentWidget from "./widgets/TopTalentWidget";
import TopCompaniesWidget from "./widgets/TopCompaniesWidget";

export default function HomeRightSidebar() {
    const { user: currentUser } = useAuth();

    return (
        <aside className="w-full lg:w-80 space-y-4">
            {/* Network Suggestions (Logged in only) */}
            {currentUser && <NetworkSuggestions />}

            {/* Career Hub Widget */}
            <CareerHubWidget />

            {/* Top Talent Leaderboard */}
            <TopTalentWidget />

            {/* Top Companies Hiring */}
            <TopCompaniesWidget />

            {/* Get Started CTA */}
            {!currentUser && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-bold">Claim your identity</h3>
                    </div>
                    <p className="text-xs text-emerald-50 mb-4 opacity-90 leading-relaxed">
                        Build your verified professional history and get matched with top opportunities.
                    </p>
                    <Link
                        href="/start"
                        className="block w-full px-4 py-2 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all text-center text-sm shadow-lg shadow-black/10"
                    >
                        Create Free Profile
                    </Link>
                </div>
            )}
        </aside>
    );
}
