'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';

interface SummaryFormProps {
    data?: string;
    onChange: (summary: string) => void;
}

export default function SummaryForm({ data, onChange }: SummaryFormProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Professional Summary</h3>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <Wand2 size={14} />
                    Generate with AI
                </button>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Summary
                </label>
                <p className="text-xs text-gray-500 mb-2">
                    Write 2-4 sentences summarizing your experience and key achievements.
                </p>
                <textarea
                    value={data || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                    placeholder="e.g. Results-driven Product Manager with 5+ years of experience leading cross-functional teams..."
                />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Keep it between 2-4 sentences.</li>
                    <li>Mention your years of experience and key job title.</li>
                    <li>Highlight your biggest achievement or unique value proposition.</li>
                    <li>Use keywords relevant to your target job.</li>
                </ul>
            </div>
        </div>
    );
}
