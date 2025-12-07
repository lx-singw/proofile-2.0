'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { resumeService, type Resume } from '@/services/resumeService';
import ResumeCard from '@/components/dashboard/ResumeCard';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { FileText, Plus, Sparkles, Lock } from 'lucide-react';

export default function ResumeListPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [resumesLoading, setResumesLoading] = useState(true);

    useEffect(() => {
        if (user) {
            resumeService.list()
                .then(setResumes)
                .catch(err => console.error('Failed to fetch resumes:', err))
                .finally(() => setResumesLoading(false));
        } else if (!loading) {
            setResumesLoading(false);
            router.push('/login?redirect=/resume');
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
            <div className="min-h-screen flex items-center justify-center p-8">
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Sign In Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Create a free account to manage your resumes and access all features.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/register')}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                        >
                            Create Free Account
                        </button>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />
            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Resumes</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage and organize your resumes</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/resume/ai-build')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>AI Build</span>
                        </button>
                        <button
                            onClick={() => router.push('/resume/build')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium"
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
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Create Resume
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
