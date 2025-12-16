'use client';

import React from 'react';
import { User, Briefcase, GraduationCap, Award, Wand2, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    id: string;
    title: string;
    icon: React.ElementType;
}

const STEPS: Step[] = [
    { id: 'personal', title: 'Personal Info', icon: User },
    { id: 'experience', title: 'Experience', icon: Briefcase },
    { id: 'education', title: 'Education', icon: GraduationCap },
    { id: 'skills', title: 'Skills', icon: Award },
    { id: 'summary', title: 'Summary', icon: Wand2 },
];

interface ProgressStepperProps {
    currentStep: number;
    onStepClick: (index: number) => void;
    completedSteps: number[];
    onTemplateClick?: () => void;
    onAIClick?: () => void;
}

export default function ProgressStepper({
    currentStep,
    onStepClick,
    completedSteps,
    onTemplateClick,
    onAIClick
}: ProgressStepperProps) {
    const progress = Math.round((completedSteps.length / STEPS.length) * 100);

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold text-emerald-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {STEPS.map((step, index) => {
                    const isActive = currentStep === index;
                    const isCompleted = completedSteps.includes(index);
                    const isPending = !isActive && !isCompleted;
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.id}
                            onClick={() => onStepClick(index)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                isActive && "bg-emerald-50 text-emerald-700 shadow-sm",
                                isCompleted && !isActive && "text-gray-700 hover:bg-gray-50",
                                isPending && "text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {/* Left accent bar for active step */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
                            )}

                            {/* Status Icon */}
                            <div className="relative flex items-center justify-center w-5 h-5">
                                {isCompleted ? (
                                    <CheckCircle2 size={20} className="text-green-500" />
                                ) : isActive ? (
                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" fill="currentColor" className="text-emerald-600" />
                                        <circle cx="10" cy="10" r="3" fill="white" className="animate-pulse" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" className="text-gray-300" />
                                    </svg>
                                )}
                            </div>

                            {/* Step Title */}
                            <span className="flex-1 text-left">{step.title}</span>

                            {/* Step Icon */}
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isActive && "bg-emerald-100 text-emerald-600",
                                isCompleted && !isActive && "bg-green-50 text-green-600",
                                isPending && "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                            )}>
                                <Icon size={16} />
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* AI Assistant Card */}
            <div className="p-4 border-t border-gray-100">
                {onAIClick && (
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-emerald-300 animate-pulse" />
                            <span className="font-bold text-sm">AI Assistant</span>
                        </div>
                        <p className="text-xs text-emerald-100 mb-3">
                            Get smart suggestions for your resume content.
                        </p>
                        <button
                            onClick={onAIClick}
                            className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                            ✨ Try AI Enhance
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
