"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, CheckCircle, Loader2, FileText, Sparkles, Target, Layout } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const STEPS = [
    { id: 'analyze', label: 'Analyzing Profile Data', icon: Brain },
    { id: 'extract', label: 'Extracting Key Achievements', icon: Target },
    { id: 'write', label: 'Writing Professional Content', icon: FileText },
    { id: 'optimize', label: 'Optimizing for ATS', icon: Sparkles },
    { id: 'format', label: 'Applying Visual Template', icon: Layout },
];

export default function AIProcessingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const role = searchParams.get('role') || 'Professional';
    const style = searchParams.get('style') || 'modern';
    const tone = searchParams.get('tone') || 'professional';

    useEffect(() => {
        let isMounted = true;

        const generateResume = async () => {
            try {
                // Start progress animation
                const progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 90) return 90; // Hold at 90% until complete
                        return prev + 1;
                    });
                }, 100);

                // Simulate steps visually while waiting for API
                const stepInterval = setInterval(() => {
                    setCurrentStepIndex(prev => prev < STEPS.length - 1 ? prev + 1 : prev);
                }, 2000);

                // Step 1: Start the build job
                const buildResponse = await fetch('/api/v1/resume/build', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_role: role,
                        style: style,
                        tone: tone
                    }),
                });

                if (!buildResponse.ok) throw new Error('Build initiation failed');

                const buildData = await buildResponse.json();
                const jobId = buildData.job_id;

                // Step 2: Trigger processing
                const processResponse = await fetch(`/api/v1/resume/build/${jobId}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_role: role,
                        style: style,
                        tone: tone
                    }),
                });

                if (!processResponse.ok) throw new Error('Processing failed');

                const processData = await processResponse.json();

                // Complete animation
                clearInterval(progressInterval);
                clearInterval(stepInterval);
                setProgress(100);
                setCurrentStepIndex(STEPS.length - 1);

                if (isMounted) {
                    setTimeout(() => {
                        router.push(`/resume/ai-build/review?id=${processData.resume_id}`);
                    }, 1000);
                }

            } catch (error) {
                console.error("Generation error:", error);
                // Handle error - could show error state or redirect back
            }
        };

        generateResume();

        return () => {
            isMounted = false;
        };
    }, [role, style, tone, router]);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md text-center">
                <div className="mb-8 flex justify-center">
                    <ProofileLogo size={48} showWordmark={false} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Building Your Resume
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-12">
                    Tailoring content for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{role}</span>
                </p>

                {/* Circular Progress */}
                <div className="w-48 h-48 mx-auto mb-12 relative">
                    <CircularProgressbar
                        value={progress}
                        text={`${Math.round(progress)}%`}
                        styles={buildStyles({
                            textSize: '16px',
                            pathColor: `rgba(79, 70, 229, ${progress / 100})`,
                            textColor: '#4F46E5',
                            trailColor: '#E5E7EB',
                            pathTransitionDuration: 0.5,
                        })}
                    />
                    {/* Pulsing ring effect */}
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 animate-ping opacity-20"></div>
                </div>

                {/* Steps List */}
                <div className="space-y-4 text-left bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-4 transition-all duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? 'bg-green-100 text-green-600' :
                                    isActive ? 'bg-indigo-100 text-indigo-600 animate-bounce' :
                                        'bg-gray-200 text-gray-400'
                                    }`}>
                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <span className={`font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' :
                                    isCompleted ? 'text-gray-900 dark:text-white' :
                                        'text-gray-500'
                                    }`}>
                                    {step.label}
                                </span>
                                {isActive && (
                                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin ml-auto" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
