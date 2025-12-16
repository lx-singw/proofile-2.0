'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Save, Clock, LayoutTemplate, Check, FileText, FileJson, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeSwitcher, { ColorScheme } from './ThemeSwitcher';
import { cn } from '@/lib/utils';


interface BuilderHeaderProps {
    lastSaved?: Date;
    onSave: () => void;
    onExport: (format: 'pdf' | 'docx' | 'json') => void;
    isSaving?: boolean;
    currentTheme: ColorScheme;
    onThemeChange: (theme: ColorScheme) => void;
    currentTemplate?: string;
    onTemplateChange?: (templateId: string) => void;
    resumeName?: string;
}

const TEMPLATES = [
    { id: 'modern', name: 'Executive' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Tech Minimalist' },
];

const EXPORT_FORMATS = [
    { id: 'pdf', name: 'PDF Document', icon: FileText },
    { id: 'docx', name: 'Word Document', icon: FileText },
    { id: 'json', name: 'JSON Data', icon: FileJson },
];

// Mock resume history - in real app, fetch from API
const RESUME_HISTORY = [
    { id: '1', name: 'Software Engineer Resume', lastEdited: '2 hours ago' },
    { id: '2', name: 'Product Manager CV', lastEdited: '1 day ago' },
    { id: '3', name: 'Data Scientist Resume', lastEdited: '3 days ago' },
];

export default function BuilderHeader({
    lastSaved,
    onSave,
    onExport,
    isSaving,
    currentTheme,
    onThemeChange,
    currentTemplate = 'modern',
    onTemplateChange,
    resumeName = 'My Resume'
}: BuilderHeaderProps) {
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const router = useRouter();

    const templateRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateRef.current && !templateRef.current.contains(event.target as Node)) {
                setIsTemplateOpen(false);
            }
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
            if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
                setIsHistoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTimestamp = (date: Date) => {
        const diff = Date.now() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-16 z-40">
            <div className="flex items-center gap-4">
                {/* Resume Name & History Dropdown */}
                <div className="relative" ref={historyRef}>
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FileText size={16} className="text-gray-500" />
                            <h1 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                {resumeName}
                                <ChevronDown size={14} className="text-gray-400" />
                            </h1>
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                {isSaving ? (
                                    <>
                                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                        Saving...
                                    </>
                                ) : lastSaved ? (
                                    <>
                                        <Clock size={12} />
                                        Saved {formatTimestamp(lastSaved)}
                                    </>
                                ) : (
                                    'Not saved yet'
                                )}
                            </span>
                        </div>
                    </button>

                    {isHistoryOpen && (
                        <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">
                                Recent Resumes
                            </div>
                            {RESUME_HISTORY.map((resume) => (
                                <button
                                    key={resume.id}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-50 group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-gray-900 group-hover:text-emerald-600">
                                            {resume.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {resume.lastEdited}
                                        </span>
                                    </div>
                                    <FileText size={16} className="text-gray-400 group-hover:text-emerald-500" />
                                </button>
                            ))}
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <Link
                                    href="/resume"
                                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                    View All Resumes
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Template Selector */}
                {onTemplateChange && (
                    <div className="relative" ref={templateRef}>
                        <button
                            onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LayoutTemplate size={18} />
                            <span className="hidden sm:inline">Template</span>
                            <ChevronDown size={14} className="text-gray-500" />
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
                                                ? "bg-emerald-50 text-emerald-700 font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {template.name}
                                        {currentTemplate === template.id && (
                                            <Check size={14} className="text-emerald-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

                <div className="h-6 w-px bg-gray-200 hidden sm:block" />

                {/* Save Button */}
                <button
                    onClick={onSave}
                    className="p-2 sm:px-4 sm:py-2 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Save size={18} />
                    <span className="hidden sm:inline">Save</span>
                </button>

                {/* Export with Format Options */}
                <div className="relative" ref={exportRef}>
                    <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDown size={14} />
                    </button>

                    {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">
                                Export Format
                            </div>
                            {EXPORT_FORMATS.map((format) => {
                                const Icon = format.icon;
                                return (
                                    <button
                                        key={format.id}
                                        onClick={() => {
                                            onExport(format.id as 'pdf' | 'docx' | 'json');
                                            setIsExportOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-gray-700 hover:bg-gray-50 hover:text-gray-900 group"
                                    >
                                        <Icon size={16} className="text-gray-400 group-hover:text-gray-600" />
                                        <span className="font-medium">{format.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
