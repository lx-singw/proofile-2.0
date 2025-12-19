"use client";

import React from "react";
import {
    Sparkles,
    ShieldCheck,
    MapPin,
    TrendingUp,
    X,
    ChevronRight,
    Search
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";

export function PersonalizationBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!user || !isVisible) return null;

    // logic for which banner to show
    const getActiveBanner = () => {
        if (user.trust_score < 20) {
            return {
                icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
                title: "Build Professional Trust",
                description: "Your reputation score is low. Verify your skills to stand out to employers.",
                action: "Verify Now",
                link: "/reputation",
                color: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20"
            };
        }

        if (user.career_intent === "upskilling" || user.opportunity_preference === "training_skills_programs") {
            return {
                icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
                title: "Growth Mindset",
                description: "We're prioritizing training and skill-building opportunities in your feed.",
                action: "Explore Skills",
                link: "/opportunities?tab=training",
                color: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20"
            };
        }

        if (user.city || user.province) {
            return {
                icon: <MapPin className="w-5 h-5 text-blue-500" />,
                title: `Opportunities in ${user.city || user.province}`,
                description: "We've matched your location preferences with local opportunities.",
                action: "View Matches",
                link: "/opportunities?location=match",
                color: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20"
            };
        }

        return {
            icon: <Search className="w-5 h-5 text-indigo-500" />,
            title: "Let's personalize your feed",
            description: "Tell us more about your career goals to get better recommendations.",
            action: "Update Profile",
            link: "/settings",
            color: "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/20"
        };
    };

    const banner = getActiveBanner();

    return (
        <div className={`relative p-4 rounded-2xl border ${banner.color} transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pr-8">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    {banner.icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {banner.title}
                        <Sparkles className="w-3 h-3 text-emerald-500 fill-current animate-pulse" />
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {banner.description}
                    </p>
                    <Link
                        href={banner.link}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-gray-900 dark:text-white hover:gap-2 transition-all"
                    >
                        {banner.action}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div >
    );
}
