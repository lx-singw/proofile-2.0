"use client";

import { useState } from "react";
import { Users, GraduationCap, Briefcase, TrendingUp, Globe, Zap } from "lucide-react";

export type PersonaType =
    | "student"
    | "graduate"
    | "apprentice"
    | "professional"
    | "job_seeker"
    | "career_changer"
    | "remote_worker"
    | "freelancer"
    | "recruiter";

interface PersonaOption {
    value: PersonaType;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const PERSONA_OPTIONS: PersonaOption[] = [
    {
        value: "student",
        label: "Student",
        description: "Currently pursuing education",
        icon: <GraduationCap className="w-8 h-8" />,
    },
    {
        value: "graduate",
        label: "Graduate",
        description: "Recently completed studies",
        icon: <GraduationCap className="w-8 h-8" />,
    },
    {
        value: "apprentice",
        label: "Apprentice",
        description: "Learning through hands-on work",
        icon: <Zap className="w-8 h-8" />,
    },
    {
        value: "professional",
        label: "Professional",
        description: "Established in your career",
        icon: <Briefcase className="w-8 h-8" />,
    },
    {
        value: "job_seeker",
        label: "Job Seeker",
        description: "Actively looking for opportunities",
        icon: <TrendingUp className="w-8 h-8" />,
    },
    {
        value: "career_changer",
        label: "Career Changer",
        description: "Transitioning to a new field",
        icon: <TrendingUp className="w-8 h-8" />,
    },
    {
        value: "remote_worker",
        label: "Remote Worker",
        description: "Working from anywhere",
        icon: <Globe className="w-8 h-8" />,
    },
    {
        value: "freelancer",
        label: "Freelancer",
        description: "Independent contractor",
        icon: <Users className="w-8 h-8" />,
    },
    {
        value: "recruiter",
        label: "Recruiter",
        description: "Finding great talent",
        icon: <Users className="w-8 h-8" />,
    },
];

interface PersonaSelectorProps {
    onSelect: (persona: PersonaType) => void;
}

export default function PersonaSelector({ onSelect }: PersonaSelectorProps) {
    const [selected, setSelected] = useState<PersonaType | null>(null);

    const handleSelect = (persona: PersonaType) => {
        setSelected(persona);
    };

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Welcome to Proofile!
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Let's personalize your experience. Who are you?
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {PERSONA_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`p-6 rounded-xl border-2 transition-all text-left ${selected === option.value
                                    ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg scale-105"
                                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md"
                                }`}
                        >
                            <div
                                className={`mb-3 ${selected === option.value
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                            >
                                {option.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {option.label}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {option.description}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        onClick={handleConfirm}
                        disabled={!selected}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all ${selected
                                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
                                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
