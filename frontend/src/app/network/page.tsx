"use client";

import React from "react";
import { Users } from "lucide-react";
import { NetworkSuggestions } from "@/components/home/NetworkSuggestions";
import TopTalentWidget from "@/components/home/widgets/TopTalentWidget";
import TopCompaniesWidget from "@/components/home/widgets/TopCompaniesWidget";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function NetworkPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 px-4 py-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-600" />
                    My Network
                </h1>
            </header>

            <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
                <section>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Suggested for you</h2>
                    <NetworkSuggestions />
                </section>

                <section>
                    <TopTalentWidget />
                </section>

                <section>
                    <TopCompaniesWidget />
                </section>
            </main>
        </div>
    );
}
