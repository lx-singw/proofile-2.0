'use client';

import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerAction: 'save' | 'download' | 'ai' | 'apply_improvements';
    score?: number;
}

export default function SignUpModal({ isOpen, onClose, triggerAction, score }: SignUpModalProps) {
    if (!isOpen) return null;

    const getContent = () => {
        switch (triggerAction) {
            case 'save':
            case 'download':
                return {
                    title: '🎉 Your Professional Resume is Ready!',
                    subtitle: "But there's something even better...",
                    description: 'Transform your resume into a living Proofile:',
                    features: [
                        'Shareable link (proofile.co/yourname)',
                        'Verified credentials (employers trust instantly)',
                        'Auto-match with jobs (opportunities find YOU)',
                        'Get rated by colleagues (build your reputation)',
                        'Update once, share everywhere (no more PDFs)'
                    ],
                    cta: 'Create Your Proofile - It\'s Free'
                };
            case 'apply_improvements':
                return {
                    title: score ? `📊 Your Resume Score: ${score}/100` : '📊 Improve Your Resume Score',
                    subtitle: 'We found ways to improve your resume!',
                    description: 'To apply AI improvements and save your enhanced resume:',
                    features: [
                        'AI-enhanced resume',
                        'Living Proofile with your data',
                        'Automatic job matching',
                        'Verification system'
                    ],
                    cta: 'Sign Up Free - Save Your Progress'
                };
            case 'ai':
                return {
                    title: '🤖 AI Resume Builder',
                    subtitle: 'Let AI build your perfect resume in 30 seconds',
                    description: 'To use AI Builder, create your Proofile:',
                    features: [
                        'AI analyzes your professional data',
                        'Generates optimized resume instantly',
                        'Updates automatically as you grow'
                    ],
                    cta: 'Create Free Proofile to Use AI Builder'
                };
            default:
                return {
                    title: 'Unlock Professional Features',
                    subtitle: 'Join thousands of professionals',
                    description: 'Create a free account to access all features:',
                    features: [
                        'Save and download unlimited resumes',
                        'Get verified credentials',
                        'Access AI tools'
                    ],
                    cta: 'Create Free Account'
                };
        }
    };

    const content = getContent();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
                    <p className="text-blue-100 font-medium">{content.subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <p className="text-gray-600 mb-6 font-medium">{content.description}</p>

                    <div className="space-y-3 mb-8">
                        {content.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
                                <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Link
                            href="/register"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:scale-[1.02]"
                        >
                            {content.cta}
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center w-full py-3 px-4 text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Already have an account? Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
