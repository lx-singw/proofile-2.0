"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export type OnboardingData = {
    experience_level?: string;
    primary_goal?: string;
    industry?: string;
};

type OnboardingWizardProps = {
    persona: string;
    onComplete: (data: OnboardingData) => Promise<void>;
};

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level", description: "0-2 years" },
    { value: "mid", label: "Mid-Level", description: "3-5 years" },
    { value: "senior", label: "Senior", description: "6-10 years" },
    { value: "expert", label: "Expert", description: "10+ years" },
];

const GOALS_BY_PERSONA: Record<string, Array<{ value: string; label: string; description: string }>> = {
    student: [
        { value: "build_first_resume", label: "Build my first resume", description: "Start from scratch" },
        { value: "prepare_interviews", label: "Prepare for interviews", description: "Practice & tips" },
        { value: "explore_opportunities", label: "Explore opportunities", description: "See what's out there" },
    ],
    graduate: [
        { value: "build_first_resume", label: "Build my first resume", description: "Professional start" },
        { value: "job_search", label: "Find my first job", description: "Active job hunting" },
        { value: "career_planning", label: "Career planning", description: "Long-term strategy" },
    ],
    professional: [
        { value: "update_resume", label: "Update my resume", description: "Keep it current" },
        { value: "career_advancement", label: "Career advancement", description: "Next level up" },
        { value: "skill_verification", label: "Verify my skills", description: "Get credentials" },
    ],
    career_changer: [
        { value: "resume_redesign", label: "Redesign my resume", description: "New focus area" },
        { value: "skill_transition", label: "Skill transition planning", description: "Bridge the gap" },
        { value: "explore_industries", label: "Explore new industries", description: "Find my fit" },
    ],
    freelancer: [
        { value: "showcase_work", label: "Showcase my work", description: "Portfolio building" },
        { value: "find_clients", label: "Find more clients", description: "Grow my business" },
        { value: "skill_verification", label: "Verify credentials", description: "Build trust" },
    ],
    recruiter: [
        { value: "find_talent", label: "Find great talent", description: "Source candidates" },
        { value: "post_jobs", label: "Post job openings", description: "Attract applicants" },
        { value: "employer_brand", label: "Build employer brand", description: "Stand out" },
    ],
    default: [
        { value: "build_resume", label: "Build/update resume", description: "Professional profile" },
        { value: "find_opportunities", label: "Find opportunities", description: "Job search" },
        { value: "network", label: "Network & connect", description: "Expand reach" },
    ],
};

const INDUSTRIES = [
    { value: "tech", label: "Tech & Software" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance & Banking" },
    { value: "education", label: "Education" },
    { value: "creative", label: "Creative & Design" },
    { value: "marketing", label: "Marketing & Sales" },
    { value: "engineering", label: "Engineering" },
    { value: "other", label: "Other" },
];

export default function OnboardingWizard({ persona, onComplete }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<OnboardingData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const shouldShowExperience = !["student", "graduate"].includes(persona);
    const shouldShowIndustry = persona !== "recruiter";

    const totalSteps = 1 + (shouldShowExperience ? 1 : 0) + (shouldShowIndustry ? 1 : 0);
    const goals = GOALS_BY_PERSONA[persona] || GOALS_BY_PERSONA.default;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...data,
                experience_level: shouldShowExperience ? data.experience_level : "entry",
            };
            await onComplete(finalData);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            setIsSubmitting(false);
        }
    };

    const getStepNumber = (stepType: string) => {
        let stepNum = 0;
        if (stepType === "goal") stepNum = 1;
        if (stepType === "experience") stepNum = shouldShowExperience ? 2 : 0;
        if (stepType === "industry") {
            stepNum = 1 + (shouldShowExperience ? 1 : 0) + 1;
        }
        return stepNum;
    };

    const isCurrentStep = (stepType: string) => currentStep === getStepNumber(stepType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                {isCurrentStep("goal") && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            What brings you to Proofile?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            We'll personalize your experience based on your primary goal.
                        </p>

                        <div className="grid gap-4">
                            {goals.map((goal) => (
                                <button
                                    key={goal.value}
                                    onClick={() => {
                                        setData({ ...data, primary_goal: goal.value });
                                        setTimeout(handleNext, 200);
                                    }}
                                    className={`text-left p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${data.primary_goal === goal.value
                                            ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600"
                                        }`}
                                >
                                    <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                        {goal.label}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {shouldShowExperience && isCurrentStep("experience") && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            What's your experience level?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            This helps us suggest the right templates and advice.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {EXPERIENCE_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => {
                                        setData({ ...data, experience_level: level.value });
                                        setTimeout(handleNext, 200);
                                    }}
                                    className={`text-center p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${data.experience_level === level.value
                                            ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600"
                                        }`}
                                >
                                    <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                        {level.label}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{level.description}</div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleBack}
                            className="mt-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>
                    </div>
                )}

                {shouldShowIndustry && isCurrentStep("industry") && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            What industry interests you?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            We'll show you relevant opportunities and insights.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {INDUSTRIES.map((industry) => (
                                <button
                                    key={industry.value}
                                    onClick={() => setData({ ...data, industry: industry.value })}
                                    className={`text-center p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${data.industry === industry.value
                                            ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600"
                                        }`}
                                >
                                    <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                        {industry.label}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>

                            <button
                                onClick={handleComplete}
                                disabled={!data.industry || isSubmitting}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${data.industry && !isSubmitting
                                        ? "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
                                        : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {isSubmitting ? "Completing..." : "Complete"}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {!shouldShowIndustry && currentStep === totalSteps && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={handleComplete}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all ${!isSubmitting
                                    ? "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
                                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? "Completing..." : "Complete Setup"}
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
