"use client";

import RegistrationForm from "../../components/auth/RegistrationForm";
import ProofileLogo from "@/components/branding/ProofileLogo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Star, Zap, CheckCircle, FileText, Sparkles, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [context, setContext] = useState<'default' | 'analysis' | 'builder'>('default');

  useEffect(() => {
    // Check if user is coming from a tool with data to save
    if (localStorage.getItem('publicAnalysis')) {
      setContext('analysis');
    } else if (localStorage.getItem('resumeData')) { // Assuming builder saves here or similar
      setContext('builder');
    }
  }, []);

  const getHeading = () => {
    switch (context) {
      case 'analysis': return "Save Your Analysis & Profile";
      case 'builder': return "Save Your Resume & Profile";
      default: return "Claim Your Professional Identity";
    }
  };

  const getSubheading = () => {
    switch (context) {
      case 'analysis': return "Create an account to save your resume insights and unlock full features.";
      case 'builder': return "Create an account to save your progress and download your resume.";
      default: return "Join the professional ecosystem where your reputation speaks for itself.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-all duration-200 hover:scale-[1.02]">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
          <ProofileLogo size={32} showWordmark={true} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="mb-8">
              {context !== 'default' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold mb-6 animate-fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>Progress Saved</span>
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {getHeading()}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                {getSubheading()}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-all duration-200 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-500">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">Verified Trust</h3>
                  <p className="text-gray-600 dark:text-gray-400">Stand out with verified credentials and experience that employers trust implicitly.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-500">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">Reputation System</h3>
                  <p className="text-gray-600 dark:text-gray-400">Build a portable reputation score based on peer reviews and verified achievements.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 hover:scale-[1.02]">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">AI Career Agent</h3>
                  <p className="text-gray-600 dark:text-gray-400">Let your personal AI agent find opportunities and optimize your profile 24/7.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900"></div>
                ))}
              </div>
              <p>Join 10,000+ professionals building their future</p>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-emerald-600"></div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Start building your professional identity today.</p>
            <RegistrationForm />

          </div>
        </div>
      </div>
    </div>
  );
}