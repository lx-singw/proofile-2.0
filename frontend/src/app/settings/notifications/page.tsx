"use client";

import { useState } from "react";
import { Bell, Mail, Check, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import ProofileLogo from "@/components/branding/ProofileLogo";

export default function NotificationSettingsPage() {
    const [preferences, setPreferences] = useState({
        analysisComplete: true,
        weeklyTips: true,
        productUpdates: false,
        marketing: false
    });
    const [saving, setSaving] = useState(false);

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success("Preferences saved successfully");
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <ProofileLogo size={32} showWordmark={true} />
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-12 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notification Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage how and when we contact you.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Choose which emails you'd like to receive</p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Analysis Complete</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when your resume analysis is ready</p>
                            </div>
                            <button
                                onClick={() => handleToggle('analysisComplete')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.analysisComplete ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.analysisComplete ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Weekly Career Tips</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Personalized advice to improve your profile</p>
                            </div>
                            <button
                                onClick={() => handleToggle('weeklyTips')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.weeklyTips ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.weeklyTips ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">Product Updates</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">New features and improvements to Proofile</p>
                            </div>
                            <button
                                onClick={() => handleToggle('productUpdates')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.productUpdates ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.productUpdates ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Save Preferences
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
