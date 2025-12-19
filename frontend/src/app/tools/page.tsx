'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

import {
    FileText,
    Upload,
    Sparkles,
    ArrowRight,
    Clock,
    Download,
    Trash2,
    MoreVertical,
    RefreshCw,
    Briefcase,
    GraduationCap,
    Award,
    Wrench,
    Shield
} from 'lucide-react';
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { resumeService, type Resume } from '@/services/resumeService';
import { toast } from '@/lib/toast';
import QuickStatsBar from '@/components/ui/QuickStatsBar';
import { FadeIn, StaggerChildren } from '@/components/ui/PageTransition';
import { Footer } from "@/components/layout/Footer";

export default function ToolsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(true);

    const [showAuthGate, setShowAuthGate] = useState(false);

    useEffect(() => {
        // We'll allow guests to see the landing page, no more hard redirect
    }, [user, loading]);

    useEffect(() => {
        const fetchResumes = async () => {
            if (!user) return;
            try {
                const data = await resumeService.list();
                setResumes(data);
            } catch (error) {
                console.error('Failed to load resumes:', error);
            } finally {
                setLoadingResumes(false);
            }
        };

        if (user) {
            fetchResumes();
        }
    }, [user]);

    const handleExport = async (id: string) => {
        try {
            await resumeService.exportPDF(id);
            toast.success('Resume exported successfully');
        } catch (error) {
            toast.error('Failed to export resume');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;
        try {
            await resumeService.delete(id);
            setResumes(prev => prev.filter(r => r.id !== id));
            toast.success('Resume deleted');
        } catch (error) {
            toast.error('Failed to delete resume');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const handleToolClick = (e: React.MouseEvent, href: string) => {
        if (!user) {
            e.preventDefault();
            setShowAuthGate(true);
        }
    };

    const resumeTools = [
        {
            icon: RefreshCw,
            title: 'Generate from Profile',
            description: 'Auto-create a resume using your Proofile data',
            href: '/resume/build',
            color: 'blue',
        },
        {
            icon: Upload,
            title: 'Upload & Analyze',
            description: 'Get AI feedback on your existing resume',
            href: '/resume/upload',
            color: 'green',
        },
        {
            icon: Sparkles,
            title: 'AI Build New Resume',
            description: 'Let AI craft your perfect resume',
            href: '/resume/ai-build',
            color: 'purple',
        },
    ];

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
            {/* Quick Stats Bar */}
            <QuickStatsBar
                stats={[
                    { label: "Resumes", value: resumes.length, href: "/resume" },
                    { label: "Resume Tools", value: resumeTools.length },
                    { label: "Career Tools", value: careerTools.length },
                ]}
            />

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
                                href="/resume"
                                onClick={(e) => handleToolClick(e, "/resume")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <FileText className="w-4 h-4" />
                                My Resumes
                            </Link>
                            <Link
                                href="/verification"
                                onClick={(e) => handleToolClick(e, "/verification")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Shield className="w-4 h-4" />
                                Verification
                            </Link>
                            <Link
                                href="/resume/ai-build"
                                onClick={(e) => handleToolClick(e, "/resume/ai-build")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Resume
                            </Link>
                        </div>
                    </div>

                    {/* Resume Tools Section */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Resume Tools
                        </h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {resumeTools.map((tool, index) => (
                                <Link
                                    key={index}
                                    href={tool.href}
                                    onClick={(e) => handleToolClick(e, tool.href)}
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${tool.color}-100 dark:bg-${tool.color}-900/30`}>
                                        <tool.icon className={`w-6 h-6 text-${tool.color}-600 dark:text-${tool.color}-400`} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all duration-200 hover:scale-[1.02]">
                                        {tool.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {tool.description}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* My Resumes Section */}
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                My Resumes {resumes.length > 0 && `(${resumes.length})`}
                            </h2>
                            <Link
                                href="/resume"
                                onClick={(e) => handleToolClick(e, "/resume")}
                                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                                Manage All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-500/5 border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {loadingResumes ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                                </div>
                            ) : resumes.length === 0 ? (
                                <div className="p-8 text-center">
                                    <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No resumes yet</p>
                                    <Link
                                        href="/resume/build"
                                        onClick={(e) => handleToolClick(e, "/resume/build")}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-lg font-medium transition-all duration-200 hover:scale-[1.02]"
                                    >
                                        Create Your First Resume
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {resumes.slice(0, 5).map((resume) => (
                                        <div key={resume.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-[1.02]">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{resume.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Last updated: {formatDate(resume.updated_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleExport(resume.id)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(resume.id)}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                                                </button>
                                                <Link
                                                    href={`/resume/build?id=${resume.id}`}
                                                    className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

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
