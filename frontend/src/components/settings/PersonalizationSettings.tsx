"use client";

import { useState } from "react";
import {
    usePersonalization,
    PersonalizationUpdate,
} from "@/providers/PersonalizationProvider";
import {
    MapPin,
    Briefcase,
    DollarSign,
    Building2,
    Clock,
    Save,
    Loader2,
} from "lucide-react";

// =============================================================================
// Province Options
// =============================================================================

const PROVINCES = [
    { value: "gauteng", label: "Gauteng" },
    { value: "western_cape", label: "Western Cape" },
    { value: "kwazulu_natal", label: "KwaZulu-Natal" },
    { value: "eastern_cape", label: "Eastern Cape" },
    { value: "limpopo", label: "Limpopo" },
    { value: "mpumalanga", label: "Mpumalanga" },
    { value: "free_state", label: "Free State" },
    { value: "north_west", label: "North West" },
    { value: "northern_cape", label: "Northern Cape" },
];

const CAREER_INTENTS = [
    { value: "actively_looking", label: "Actively Looking" },
    { value: "passively_open", label: "Open to Opportunities" },
    { value: "career_changer", label: "Changing Careers" },
    { value: "upskilling", label: "Upskilling" },
    { value: "returning_to_work", label: "Returning to Work" },
    { value: "exploring_options", label: "Exploring Options" },
];

const WORK_MODES = [
    { value: "remote_only", label: "Remote Only" },
    { value: "hybrid", label: "Hybrid" },
    { value: "office_based", label: "Office Based" },
    { value: "field_work", label: "Field Work" },
    { value: "flexible", label: "Flexible" },
];

// =============================================================================
// Component
// =============================================================================

export default function PersonalizationSettings() {
    const { context, isLoading, updatePreferences } = usePersonalization();
    const [saving, setSaving] = useState(false);
    const [localState, setLocalState] = useState<PersonalizationUpdate>({});

    const handleChange = (field: keyof PersonalizationUpdate, value: any) => {
        setLocalState((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (Object.keys(localState).length === 0) return;

        setSaving(true);
        try {
            await updatePreferences(localState);
            setLocalState({});
        } catch (err) {
            console.error("Failed to save preferences:", err);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    const getValue = (field: keyof PersonalizationUpdate) => {
        return localState[field] ?? context?.[field as keyof typeof context] ?? "";
    };

    return (
        <div className="space-y-8">
            {/* Career Path Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Career Path Preference</h3>
                        <p className="text-sm text-gray-500">What is your primary focus right now?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { id: "jobs", label: "Jobs & Careers", desc: "Professional employment and contract work", icon: "💼" },
                        { id: "training_skills_programs", label: "Training & Skills", desc: "Internships, learnerships, and upskilling", icon: "📚" },
                        { id: "both", label: "Both", desc: "Show me all opportunities", icon: "✨" }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => handleChange("opportunity_preference", opt.id)}
                            className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all ${getValue("opportunity_preference") === opt.id
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-4 ring-indigo-500/10"
                                    : "border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-600"
                                }`}
                        >
                            <span className="text-2xl mb-2">{opt.icon}</span>
                            <span className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{opt.label}</span>
                            <span className="text-xs text-gray-500 leading-tight">{opt.desc}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Location Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Location</h3>
                        <p className="text-sm text-gray-500">Where are you based?</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Province
                        </label>
                        <select
                            value={getValue("province") as string}
                            onChange={(e) => handleChange("province", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select province</option>
                            {PROVINCES.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City
                        </label>
                        <input
                            type="text"
                            value={getValue("city") as string}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder="e.g., Johannesburg"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={getValue("willing_to_relocate") as boolean}
                                onChange={(e) => handleChange("willing_to_relocate", e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                I am willing to relocate
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            {/* Career Intent Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Career Intent</h3>
                        <p className="text-sm text-gray-500">What are you looking for?</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Job Search Status
                        </label>
                        <select
                            value={getValue("career_intent") as string}
                            onChange={(e) => handleChange("career_intent", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select status</option>
                            {CAREER_INTENTS.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notice Period (weeks)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="52"
                            value={getValue("notice_period_weeks") as number || ""}
                            onChange={(e) => handleChange("notice_period_weeks", parseInt(e.target.value) || null)}
                            placeholder="e.g., 4"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </section>

            {/* Salary Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Salary Expectations</h3>
                        <p className="text-sm text-gray-500">Your expected annual salary (ZAR)</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Minimum (ZAR)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="10000"
                            value={getValue("salary_expectation_min") as number || ""}
                            onChange={(e) => handleChange("salary_expectation_min", parseInt(e.target.value) || null)}
                            placeholder="e.g., 350000"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Maximum (ZAR)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="10000"
                            value={getValue("salary_expectation_max") as number || ""}
                            onChange={(e) => handleChange("salary_expectation_max", parseInt(e.target.value) || null)}
                            placeholder="e.g., 500000"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={getValue("salary_negotiable") as boolean}
                                onChange={(e) => handleChange("salary_negotiable", e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Salary is negotiable
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            {/* Work Mode Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Work Mode</h3>
                        <p className="text-sm text-gray-500">Your preferred work arrangement</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Work Preference
                        </label>
                        <select
                            value={getValue("work_mode_preference") as string}
                            onChange={(e) => handleChange("work_mode_preference", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select preference</option>
                            {WORK_MODES.map((w) => (
                                <option key={w.value} value={w.value}>
                                    {w.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Commute (minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={getValue("max_commute_minutes") as number || ""}
                            onChange={(e) => handleChange("max_commute_minutes", parseInt(e.target.value) || null)}
                            placeholder="e.g., 45"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </section>

            {/* Experience Section */}
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Experience</h3>
                        <p className="text-sm text-gray-500">Your professional experience</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Years of Experience
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="50"
                        value={getValue("years_experience") as number || ""}
                        onChange={(e) => handleChange("years_experience", parseInt(e.target.value) || null)}
                        placeholder="e.g., 5"
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </section>

            {/* Save Button */}
            {Object.keys(localState).length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Preferences
                    </button>
                </div>
            )}
        </div>
    );
}
