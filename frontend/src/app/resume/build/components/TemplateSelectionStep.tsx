import React from 'react';
import { templates } from '@/components/resume/templates';
import { THEMES, ColorScheme } from './ThemeSwitcher';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TemplateSelectionStepProps {
    selectedTemplate: string;
    onTemplateSelect: (id: string) => void;
    selectedTheme: ColorScheme;
    onThemeSelect: (theme: ColorScheme) => void;
    onContinue: () => void;
}

export default function TemplateSelectionStep({
    selectedTemplate,
    onTemplateSelect,
    selectedTheme,
    onThemeSelect,
    onContinue
}: TemplateSelectionStepProps) {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Template</h1>
                <p className="text-gray-600">Select a professional design to start building your resume</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        className={cn(
                            "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200",
                            selectedTemplate === template.id
                                ? "border-emerald-600 ring-4 ring-emerald-50 shadow-xl scale-[1.02]"
                                : "border-gray-200 hover:border-emerald-400 hover:shadow-lg"
                        )}
                        onClick={() => onTemplateSelect(template.id)}
                    >
                        <div className="aspect-[1/1.4] relative bg-gray-100">
                            {/* Placeholder for thumbnail if image fails or is missing */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                {template.thumbnail ? (
                                    <div className="relative w-full h-full">
                                        {/* Using a simple div with background image for now to avoid next/image complexity with unknown paths */}
                                        {/* Actually, let's use a placeholder icon if image fails, but try to show image */}
                                        <img
                                            src={template.thumbnail}
                                            alt={template.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                                e.currentTarget.parentElement!.innerHTML = '<span class="text-sm">Preview</span>';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <span>No Preview</span>
                                )}
                            </div>

                            {/* Overlay */}
                            <div className={cn(
                                "absolute inset-0 bg-emerald-900/0 transition-colors flex items-center justify-center",
                                selectedTemplate === template.id ? "bg-emerald-900/10" : "group-hover:bg-emerald-900/5"
                            )}>
                                {selectedTemplate === template.id && (
                                    <div className="bg-emerald-600 text-white p-3 rounded-full shadow-lg animate-in zoom-in">
                                        <Check size={24} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100">
                            <h3 className="font-bold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-500">{template.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Select Color Theme</h3>
                <div className="flex flex-wrap gap-4">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => onThemeSelect(theme.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                                selectedTheme === theme.id
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                            )}
                        >
                            <div
                                className="w-6 h-6 rounded-full shadow-sm"
                                style={{ backgroundColor: theme.color }}
                            />
                            <span className="font-medium">{theme.name}</span>
                            {selectedTheme === theme.id && <Check size={16} className="ml-2 text-emerald-600" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onContinue}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                    Start Building
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
