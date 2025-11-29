'use client';

import React from 'react';
import { User, Briefcase, GraduationCap, Award, Wand2, CheckCircle2, Circle } from 'lucide-react';
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
    { id: 'skills', title: 'Skills', icon: Wand2 },
    { id: 'summary', title: 'Summary', icon: Award },
];

interface ProgressStepperProps {
    currentStep: number;
    onStepClick: (index: number) => void;
    completedSteps: number[];
}

export default function ProgressStepper({ currentStep, onStepClick, completedSteps }: ProgressStepperProps) {
    const progress = Math.round((completedSteps.length / STEPS.length) * 100);

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {STEPS.map((step, index) => {
                    const isActive = currentStep === index;
                    const isCompleted = completedSteps.includes(index);
                    const Icon = step.icon;

                    return (
                        <button
                            key={step.id}
                            onClick={() => onStepClick(index)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                            )}

                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                            )}>
                                <Icon size={16} />
                            </div>

                            <span className="flex-1 text-left">{step.title}</span>

                            {isCompleted && (
                                <CheckCircle2 size={16} className="text-green-500" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Wand2 size={16} className="text-yellow-300" />
                        <span className="font-bold text-sm">AI Assistant</span>
                    </div>
                    <p className="text-xs text-indigo-100 mb-3">
                        Get smart suggestions for your resume content.
                    </p>
                    <button className="w-full py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors">
                        Try AI Enhance
                    </button>
                </div>
            </div>
        </div>
    );
}
