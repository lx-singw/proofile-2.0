'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

import {
    ArrowRight,
    Briefcase,
    GraduationCap,
    Award,
    Wrench,
    Shield
} from 'lucide-react';
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { toast } from '@/lib/toast';

import { FadeIn, StaggerChildren } from '@/components/ui/PageTransition';
import { Footer } from "@/components/layout/Footer";

export default function ToolsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [showAuthGate, setShowAuthGate] = useState(false);

    useEffect(() => {
        // We'll allow guests to see the landing page, no more hard redirect
    }, [user, loading]);

    const handleToolClick = (e: React.MouseEvent, href: string) => {
        if (!user) {
            e.preventDefault();
            setShowAuthGate(true);
        }
    };

    const careerTools = [
        {
            icon: Briefcase,
            title: 'Job Matching',
            description: 'Find opportunities that match your profile',
            href: '/jobs',
            color: 'orange',
        },
        {
            icon: GraduationCap,
            title: 'Skills Assessment',
            description: 'Evaluate and verify your skills',
            href: '/dashboard/verification',
            color: 'teal',
        },
        {
            icon: Award,
            title: 'Get Verified',
            description: 'Add credentials to stand out',
            href: '/dashboard/verification',
            color: 'yellow',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <FadeIn>
                    {/* Header - Jobs Style */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Wrench className="w-8 h-8 text-emerald-600" />
                                Career Tools
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Everything you need to build and manage your professional presence
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/verification"
                                onClick={(e) => handleToolClick(e, "/verification")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Shield className="w-4 h-4" />
                                Verification
                            </Link>
                        </div>
                    </div>

                    {/* Career Tools Section */}
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Career Tools
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {careerTools.map((tool, index) => (
                                <Link
                                    key={index}
                                    href={tool.href}
                                    onClick={(e) => handleToolClick(e, tool.href)}
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-gray-700">
                                        <tool.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-200 hover:scale-[1.02]">
                                        {tool.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {tool.description}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                                        Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </FadeIn>
            </main>

            <AuthGateModal
                isOpen={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                actionType="generic"
                title="Unlock AI Career Tools"
                description="Join Proofile to use our AI resume builder, skill analyzer, and personalized career matching."
            />

            <Footer />
        </>
    );
}
