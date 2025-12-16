"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { CheckCircle, Shield, Globe, Lock, ArrowRight, Loader2, Sparkles, User, LayoutDashboard, Briefcase, ShieldCheck, Star, BarChart } from "lucide-react";
import { toast } from "@/lib/toast";
import { resumeService } from "@/services/resumeService";

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading: authLoading, updateUser } = useAuth();
    const [step, setStep] = useState<'welcome' | 'username' | 'visibility' | 'tour' | 'complete'>('welcome');
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [username, setUsername] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [loading, setLoading] = useState(false);

    // Redirect logic: Protect route for unauthenticated or already-onboarded users
    const hasCheckedStatus = React.useRef(false);

    // Redirect logic: Protect route for unauthenticated or already-onboarded users
    useEffect(() => {
        if (authLoading) return; // Wait for auth to load

        // Only check status once to prevent redirecting when user updates their username during onboarding
        if (hasCheckedStatus.current) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        // If user already has a username, they've completed onboarding - redirect to dashboard
        // Use truthy check to handle both null and empty string
        if (user.username && user.username.trim() !== '') {
            console.log('[onboarding] User already has username, redirecting to dashboard');
            router.replace('/dashboard');
        }

        hasCheckedStatus.current = true;
    }, [authLoading, user, router]);

    const hasStartedImport = React.useRef(false);

    useEffect(() => {
        if (!user) return; // Don't run import if not authenticated
        if (hasStartedImport.current) return; // Only run once
        hasStartedImport.current = true;

        // Auto-import data if available
        const importData = async () => {
            const publicAnalysis = localStorage.getItem('publicAnalysis');
            const resumeData = localStorage.getItem('resumeData');

            if (publicAnalysis || resumeData) {
                setImportStatus('importing');
                try {
                    if (publicAnalysis) {
                        const analysis = JSON.parse(publicAnalysis);
                        // Create resume from analysis
                        // We need to map analysis sections to resume data structure
                        await resumeService.create(
                            analysis.name || "Imported Resume",
                            "modern",
                            {
                                personal: {
                                    name: user?.full_name || "User",
                                    email: user?.email || "",
                                    summary: analysis.sections?.summary || "",
                                },
                                // Additional fields from analysis
                                skills: analysis.sections?.skills || [],
                            }
                        );
                        localStorage.removeItem('publicAnalysis');
                    } else if (resumeData) {
                        const data = JSON.parse(resumeData);
                        await resumeService.create(
                            "My Resume",
                            "modern",
                            data
                        );
                        localStorage.removeItem('resumeData');
                    }
                    setImportStatus('success');
                    setTimeout(() => setStep('username'), 1500);
                } catch (error) {
                    console.error("Import failed", error);
                    setImportStatus('error');
                    toast.error("Failed to import your data", "You can try again later.");
                    setTimeout(() => setStep('username'), 1500);
                }
            } else {
                // No data to import, move to next step after a brief welcome
                setTimeout(() => setStep('username'), 2000);
            }
        };

        importData();
    }, [user]);

    const handleUsernameSubmit = async () => {
        if (!username) return;
        setLoading(true);
        try {
            // Use updateUser from auth hook to update both API and local cache
            await updateUser({ username });
            setStep('visibility');
        } catch (error: unknown) {
            // Extract error message from API response
            const errorMessage = (error as { detail?: string })?.detail
                || "Username might already be taken. Please try a different one.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            await updateUser({ profile_visibility: visibility });
            setStep('tour');
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleTourComplete = async () => {
        setStep('complete');
        sessionStorage.setItem('justCompletedOnboarding', 'true');
        setTimeout(() => router.push('/dashboard'), 1500);
    };

    // Show loading while checking auth
    // if (authLoading || !user) {
    //     return (
    //         <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
    //             <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <ProofileLogo size={48} showWordmark={false} />
                </div>

                {step === 'welcome' && (
                    <div className="text-center space-y-6 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome to Proofile
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Setting up your professional identity ecosystem...
                        </p>

                        {importStatus === 'importing' && (
                            <div className="flex flex-col items-center gap-3 text-blue-600">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">Importing your resume analysis...</span>
                            </div>
                        )}

                        {importStatus === 'success' && (
                            <div className="flex flex-col items-center gap-3 text-green-600">
                                <CheckCircle className="w-8 h-8" />
                                <span className="text-sm font-medium">Data imported successfully!</span>
                            </div>
                        )}
                    </div>
                )}

                {step === 'username' && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                            <User className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Claim your username</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Choose a unique username for your professional profile URL.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Username
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-gray-400">proofile.co/</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        className="w-full pl-24 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="username"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUsernameSubmit}
                                disabled={!username || loading}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'visibility' && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Visibility</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Control who can see your professional profile.
                        </p>

                        <div className="space-y-4 mb-8">
                            <button
                                onClick={() => setVisibility('public')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${visibility === 'public'
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${visibility === 'public' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${visibility === 'public' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>Public</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Visible to everyone. Perfect for job seeking and networking.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setVisibility('private')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${visibility === 'private'
                                    ? 'border-gray-600 bg-gray-50 dark:bg-gray-800'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${visibility === 'private' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${visibility === 'private' ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>Private</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Only visible to you and people you share the link with.</p>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Finish Setup <Sparkles className="w-4 h-4" /></>}
                        </button>
                    </div>
                )}

                {step === 'tour' && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in max-w-2xl w-full">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                <LayoutDashboard className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Proofile Dashboard</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Here's what you can do with your new professional identity:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Profile</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage your living resume</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Jobs</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">AI-matched opportunities</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Verify</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Get credentials verified</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-start gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                                    <Star className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Reputation</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Collect peer reviews</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleTourComplete}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            Start Exploring <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {step === 'complete' && (
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            You're All Set!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Redirecting to your dashboard...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
