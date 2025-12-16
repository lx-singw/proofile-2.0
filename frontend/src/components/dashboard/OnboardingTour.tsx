"use client";

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: '[data-tour="welcome"]',
        title: 'Welcome to Proofile! 👋',
        content: 'Let\'s take a quick tour to show you around your new dashboard.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="resume-tools"]',
        title: 'Resume Tools',
        content: 'Create professional resumes from scratch or upload existing ones for AI-powered refinement.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="profile-verification"]',
        title: 'Build Your Profile',
        content: 'Verify your skills, get peer ratings, and climb the leaderboard to stand out.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="job-discovery"]',
        title: 'Discover Opportunities',
        content: 'Find jobs with AI matching, explore trending positions, and track salary insights.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="stats"]',
        title: 'Track Your Progress',
        content: 'Monitor your resumes, verifications, and ratings all in one place.',
        placement: 'top',
    },
    {
        target: '[data-tour="fab"]',
        title: 'Quick Actions',
        content: 'Click this button anytime for quick access to common actions!',
        placement: 'left',
    },
];

interface OnboardingTourProps {
    onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasCompletedTour, setHasCompletedTour] = useState(false);

    useEffect(() => {
        // Check if user has completed tour
        const completed = localStorage.getItem('dashboard_tour_completed');
        if (!completed) {
            // Auto-start tour for new users after a short delay
            const timer = setTimeout(() => setIsActive(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setHasCompletedTour(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
            scrollToTarget(tourSteps[currentStep + 1].target);
        } else {
            completeTour();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            scrollToTarget(tourSteps[currentStep - 1].target);
        }
    };

    const completeTour = () => {
        localStorage.setItem('dashboard_tour_completed', 'true');
        setIsActive(false);
        setHasCompletedTour(true);
        if (onComplete) onComplete();
    };

    const skipTour = () => {
        completeTour();
    };

    const restartTour = () => {
        setCurrentStep(0);
        setIsActive(true);
        scrollToTarget(tourSteps[0].target);
    };

    const scrollToTarget = (selector: string) => {
        setTimeout(() => {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const getTargetPosition = () => {
        const step = tourSteps[currentStep];
        const element = document.querySelector(step.target);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        const placement = step.placement || 'bottom';

        let top = 0;
        let left = 0;

        switch (placement) {
            case 'bottom':
                top = rect.bottom + window.scrollY + 16;
                left = rect.left + window.scrollX + rect.width / 2;
                break;
            case 'top':
                top = rect.top + window.scrollY - 16;
                left = rect.left + window.scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + window.scrollY + rect.height / 2;
                left = rect.left + window.scrollX - 16;
                break;
            case 'right':
                top = rect.top + window.scrollY + rect.height / 2;
                left = rect.right + window.scrollX + 16;
                break;
        }

        return { top, left, placement, rect };
    };

    if (!isActive) {
        return hasCompletedTour ? (
            <button
                onClick={restartTour}
                className="fixed bottom-24 right-6 z-40 px-4 py-2 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-full shadow-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-xl transition-all text-sm font-medium"
            >
                Take Tour Again
            </button>
        ) : null;
    }

    const position = getTargetPosition();
    const step = tourSteps[currentStep];

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-40" onClick={skipTour} />

            {/* Spotlight */}
            {position && (
                <div
                    className="fixed z-40 pointer-events-none"
                    style={{
                        top: position.rect.top + window.scrollY - 8,
                        left: position.rect.left + window.scrollX - 8,
                        width: position.rect.width + 16,
                        height: position.rect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        borderRadius: '12px',
                    }}
                />
            )}

            {/* Tour Card */}
            {position && (
                <div
                    className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700"
                    style={{
                        top: position.placement === 'top' ? position.top - 200 : position.top,
                        left: position.left - 160,
                        transform: position.placement === 'left' ? 'translateX(-100%)' : position.placement === 'right' ? 'translateX(0)' : 'translateX(0)',
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={skipTour}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {step.content}
                        </p>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                        <div className="flex gap-1">
                            {tourSteps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1 flex-1 rounded-full transition-colors ${index === currentStep
                                            ? 'bg-emerald-600'
                                            : index < currentStep
                                                ? 'bg-emerald-300'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            Step {currentStep + 1} of {tourSteps.length}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                        </button>

                        {currentStep < tourSteps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={completeTour}
                                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                            >
                                Get Started!
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
