'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Save, MoreVertical, LayoutTemplate, Check } from 'lucide-react';
import Link from 'next/link';
import ThemeSwitcher, { ColorScheme } from './ThemeSwitcher';
import { cn } from '@/lib/utils';

interface BuilderHeaderProps {
    lastSaved?: Date;
    onSave: () => void;
    onExport: () => void;
    isSaving?: boolean;
    currentTheme: ColorScheme;
    onThemeChange: (theme: ColorScheme) => void;
    currentTemplate?: string;
    onTemplateChange?: (templateId: string) => void;
}

const TEMPLATES = [
    { id: 'modern', name: 'Executive' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Tech Minimalist' },
];

export default function BuilderHeader({
    lastSaved,
    onSave,
    onExport,
    isSaving,
    currentTheme,
    onThemeChange,
    currentTemplate = 'modern',
    onTemplateChange
}: BuilderHeaderProps) {
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const templateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateRef.current && !templateRef.current.contains(event.target as Node)) {
                setIsTemplateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft size={20} />
                </Link>

                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
                            RB
                        </span>
                        Resume Builder
                    </h1>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        {isSaving ? (
                            <span className="flex items-center gap-1 text-blue-600">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                Saving...
                            </span>
                        ) : lastSaved ? (
                            `Auto-saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        ) : (
                            'Unsaved changes'
                        )}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {onTemplateChange && (
                    <div className="relative" ref={templateRef}>
                        <button
                            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LayoutTemplate size={18} />
                            <span className="hidden sm:inline">Templates</span>
                        </button>

                        {isTemplateOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">
                                    Select Template
                                </div>
                                {TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => {
                                            onTemplateChange(template.id);
                                            setIsTemplateOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                            currentTemplate === template.id
                                                ? "bg-gray-50 text-gray-900 font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {template.name}
                                        {currentTemplate === template.id && (
                                            <Check size={14} className="text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

                <div className="h-6 w-px bg-gray-200 hidden sm:block" />

                <button
                    onClick={onSave}
                    className="p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Save size={18} />
                    <span className="hidden sm:inline">Save</span>
                </button>

                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export</span>
                </button>

                <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </header>
    );
}
