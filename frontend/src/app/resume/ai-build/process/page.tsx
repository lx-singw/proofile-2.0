"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Brain, CheckCircle, Loader2, AlertCircle, Terminal, Code, Cpu, FileText } from 'lucide-react';
import { processAIBuild } from '@/services/resumeService';

const LOG_MESSAGES = [
    "Initializing AI engine (GPT-4o)...",
    "Connecting to profile database...",
    "Fetching user profile data...",
    "Analyzing work history (3 positions found)...",
    "Extracting key skills and competencies...",
    "Identifying leadership patterns...",
    "Loading target role requirements...",
    "Matching profile to job description...",
    "Generating professional summary...",
    "Optimizing bullet points for impact...",
    "Injecting ATS-friendly keywords...",
    "Formatting document structure...",
    "Applying 'Modern Executive' style...",
    "Finalizing document generation...",
    "Process complete."
];

const TIPS = [
    "Did you know? Quantifiable achievements increase interview chances by 40%.",
    "Our AI ensures your resume passes through Applicant Tracking Systems (ATS).",
    "Recruiters spend an average of 7 seconds scanning a resume.",
    "Active verbs like 'Led', 'Created', and 'Optimized' are more impactful.",
    "Tailoring your resume to the job description is the #1 way to get hired."
];

export default function AIProcessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');
    const logEndRef = useRef<HTMLDivElement>(null);
    
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [currentTip, setCurrentTip] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Initializing...");

    // Auto-scroll logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Rotate tips
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip(prev => (prev + 1) % TIPS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!jobId) {
            setError("No Job ID provided");
            return;
        }

        let isMounted = true;
        let logIndex = 0;

        // Simulate logs and progress
        const progressInterval = setInterval(() => {
            if (!isMounted) return;
            
            // Update progress
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + (Math.random() * 3);
            });

            // Add logs
            if (Math.random() > 0.6 && logIndex < LOG_MESSAGES.length) {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${LOG_MESSAGES[logIndex]}`]);
                logIndex++;
            }

            // Update status text based on progress
            if (progress < 30) setStatus("Analyzing Profile...");
            else if (progress < 60) setStatus("Structuring Content...");
            else if (progress < 85) setStatus("Optimizing Keywords...");
            else setStatus("Finalizing Layout...");

        }, 300);

        // Trigger actual processing
        async function startProcessing() {
            try {
                // We pass empty data as the config was saved in the job creation
                const result = await processAIBuild(jobId!, {});
                
                if (isMounted) {
                    setProgress(100);
                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SUCCESS: Resume generated successfully.`]);
                    setStatus("Complete!");
                    clearInterval(progressInterval);
                    
                    // Small delay to show 100%
                    setTimeout(() => {
                        router.push(`/resume/ai-build/review?id=${result.resume_id}`);
                    }, 1500);
                }
            } catch (err: any) {
                console.error("Processing error:", err);
                if (isMounted) {
                    setError(err.message || "An error occurred during AI generation.");
                    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`]);
                    clearInterval(progressInterval);
                }
            }
        }

        startProcessing();

        return () => {
            isMounted = false;
            clearInterval(progressInterval);
        };
    }, [jobId, router, progress]); // Added progress to dependency

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-mono">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-500/50">
                    <div className="flex items-center gap-3 mb-6 text-red-500">
                        <AlertCircle className="h-8 w-8" />
                        <h2 className="text-xl font-bold">System Error</h2>
                    </div>
                    <div className="bg-black p-4 rounded-lg mb-6 text-red-400 text-sm border border-gray-700 font-mono">
                        {`> Error: ${error}`}
                        <br/>
                        {`> Process terminated.`}
                    </div>
                    <button 
                        onClick={() => router.push('/resume/ai-build')}
                        className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 font-sans">
            <div className="max-w-2xl w-full space-y-8">
                
                {/* Main Visual */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        {/* Outer Ring */}
                        <div className="h-32 w-32 rounded-full border-4 border-gray-700 flex items-center justify-center relative">
                            <div 
                                className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                                style={{ animationDuration: '1.5s' }}
                            ></div>
                            <Brain className="h-12 w-12 text-blue-400 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs font-mono text-blue-300">
                            {Math.round(progress)}%
                        </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                            {status}
                            <span className="flex gap-1">
                                <span className="animate-bounce delay-0">.</span>
                                <span className="animate-bounce delay-100">.</span>
                                <span className="animate-bounce delay-200">.</span>
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm">AI Agent is processing your request</p>
                    </div>
                </div>

                {/* Terminal Log */}
                <div className="bg-black rounded-xl border border-gray-800 shadow-2xl overflow-hidden font-mono text-sm">
                    <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                        <Terminal className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400 text-xs">build_log.txt</span>
                        <div className="flex-1"></div>
                        <div className="flex gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500/50"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50"></div>
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    <div className="p-4 h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {logs.map((log, i) => (
                            <div key={i} className="text-green-400/90 flex gap-2">
                                <span className="text-gray-600 select-none">{`>`}</span>
                                <span>{log}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                        <div className="animate-pulse text-green-400/50">_</div>
                    </div>
                </div>

                {/* Dynamic Tips */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-4 backdrop-blur-sm">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Cpu className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">AI Insight</h3>
                        <p className="text-gray-300 text-sm transition-all duration-500 ease-in-out">
                            {TIPS[currentTip]}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
