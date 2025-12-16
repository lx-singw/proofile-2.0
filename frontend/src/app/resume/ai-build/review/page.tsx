"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Download, Edit, ArrowRight, RefreshCw } from "lucide-react";

import { resumeService, type Resume } from "@/services/resumeService";
import PreviewPanel from "../../build/components/PreviewPanel"; // Reusing existing preview
import { toast } from "@/lib/toast";

export default function AIReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resumeId = searchParams.get('id');
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (resumeId) {
            resumeService.get(resumeId)
                .then(setResume)
                .catch(err => {
                    console.error("Failed to fetch resume:", err);
                    toast.error("Failed to load generated resume");
                })
                .finally(() => setLoading(false));
        }
    }, [resumeId]);

    const handleDownload = async () => {
        if (!resumeId) return;
        try {
            const blob = await resumeService.exportPDF(resumeId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${resume?.name || 'resume'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download PDF");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resume Not Found</h1>
                <button
                    onClick={() => router.push('/resume/ai-build')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            <span>Generation Complete</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/resume/ai-build')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Start Over
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                        <button
                            onClick={() => router.push(`/resume/build?id=${resumeId}`)} // Assuming build page supports editing by ID
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                        >
                            <Edit className="w-4 h-4" />
                            Edit & Refine
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-hidden">
                <div className="max-w-5xl mx-auto h-full flex flex-col">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 relative">
                        {/* Reuse PreviewPanel but make it full size/read-only if possible */}
                        {/* Note: PreviewPanel expects ResumeData, we might need to adapt resume.data */}
                        <div className="absolute inset-0 overflow-y-auto">
                            <PreviewPanel
                                data={resume.data}
                                templateId={resume.template_id || 'modern'}
                                theme="slate" // Default theme
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
