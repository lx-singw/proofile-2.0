import React from "react";
import { type Profile } from "@/services/profileService";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface CompletenessWidgetProps {
    profile: Profile;
    className?: string;
}

export function CompletenessWidget({ profile, className = "" }: CompletenessWidgetProps) {
    const score = Math.round(profile.completeness_score || 0);
    const data = profile.completeness_data || {
        basics: 0,
        experience: 0,
        education: 0,
        skills: 0,
    };

    // Determine state color
    let colorClass = "bg-red-500";
    if (score >= 30) colorClass = "bg-yellow-500";
    if (score >= 70) colorClass = "bg-blue-500";
    if (score >= 90) colorClass = "bg-green-500";

    return (
        <div className={`proofile-card p-6 ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Strength</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${colorClass}`}>
                    {score}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                <CompletenessItem
                    label="Basics"
                    current={data.basics}
                    max={30}
                    description="Photo, Headline, Summary"
                />
                <CompletenessItem
                    label="Experience"
                    current={data.experience}
                    max={30}
                    description="Work History"
                />
                <CompletenessItem
                    label="Skills"
                    current={data.skills}
                    max={20}
                    description="Top Skills"
                />
                <CompletenessItem
                    label="Education"
                    current={data.education}
                    max={20}
                    description="Degrees & Certs"
                />
            </div>

            {score < 100 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">Reach 'All-Star' status</p>
                            <p className="text-xs text-blue-700 mt-1">Complete your profile to unlock premium job matches and badges.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CompletenessItem({ label, current, max, description }: { label: string; current: number; max: number; description: string }) {
    const isComplete = current >= max;

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                )}
                <div>
                    <p className={`text-sm font-medium ${isComplete ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
                </div>
            </div>
            <div className="text-right">
                <span className={`text-xs ${isComplete ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    {isComplete ? "Completed" : description}
                </span>
            </div>
        </div>
    );
}
