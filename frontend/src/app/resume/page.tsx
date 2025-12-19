'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { resumeService, type Resume } from '@/services/resumeService';
import ResumeCard from '@/components/dashboard/ResumeCard';
import { Footer } from '@/components/layout/Footer';

import { FileText, Plus, Sparkles, Lock } from 'lucide-react';
import { AuthGateModal } from "@/components/auth/AuthGateModal";

export default function ResumeListPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [resumesLoading, setResumesLoading] = useState(true);

    const [showAuthGate, setShowAuthGate] = useState(false);

    useEffect(() => {
        if (user) {
            resumeService.list()
                .then(setResumes)
                .catch(err => console.error('Failed to fetch resumes:', err))
                .finally(() => setResumesLoading(false));
        } else if (!loading) {
            setResumesLoading(false);
            // router.push('/login?redirect=/resume');
        }
    }, [user, loading, router]);

    const handleResumeExport = async (id: string) => {
        try {
            const blob = await resumeService.exportPDF(id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resume_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleResumeDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        try {
            await resumeService.delete(id);
            setResumes(resumes.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <p className="animate-pulse">Loading...</p>
            </div>
        );
    }


    return (
        <>

            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Resumes</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and organize your resumes</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (!user) {
                                    setShowAuthGate(true);
                                    return;
                                }
                                router.push('/resume/ai-build');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] font-medium shadow-sm hover:shadow-md"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>AI Build</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!user) {
                                    setShowAuthGate(true);
                                    return;
                                }
                                router.push('/resume/build');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-200 hover:scale-[1.02] font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Manual</span>
                        </button>
                    </div>
                </div>

                {!resumesLoading && (
                    <>
                        {resumes.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resumes.map((resume) => (
                                    <ResumeCard
                                        key={resume.id}
                                        id={resume.id}
                                        name={resume.name}
                                        template_id={resume.template_id}
                                        updated_at={resume.updated_at}
                                        onExport={handleResumeExport}
                                        onDelete={handleResumeDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resumes yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first resume to get started</p>
                                <button
                                    onClick={() => router.push('/resume/build')}
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] font-medium"
                                >
                                    Create Resume
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
            <AuthGateModal
                isOpen={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                actionType="generic"
                title="Build a Premium Resume"
                description="Sign up to use our AI resume builder, export to PDF, and share your verified profile with top employers."
            />

            <Footer />
        </>
    );
}
