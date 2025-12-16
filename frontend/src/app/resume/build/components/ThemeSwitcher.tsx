'use client';

import React from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ColorScheme = 'slate' | 'navy' | 'charcoal' | 'burgundy' | 'forest';

interface ThemeSwitcherProps {
    currentTheme: ColorScheme;
    onThemeChange: (theme: ColorScheme) => void;
}

export const THEMES: { id: ColorScheme; name: string; color: string }[] = [
    { id: 'slate', name: 'Executive Slate', color: '#0f172a' },
    { id: 'navy', name: 'Classic Navy', color: '#1e3a8a' },
    { id: 'charcoal', name: 'Tech Charcoal', color: '#1f2937' },
    { id: 'burgundy', name: 'Royal Burgundy', color: '#881337' },
    { id: 'forest', name: 'Nature Forest', color: '#14532d' },
];

export default function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Palette size={18} />
                <span className="hidden sm:inline">Theme</span>
                <ChevronDown size={14} className="text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">
                        Select Theme
                    </div>
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => {
                                onThemeChange(theme.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                currentTheme === theme.id
                                    ? "bg-gray-50 text-gray-900 font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full shadow-sm"
                                    style={{ backgroundColor: theme.color }}
                                />
                                {theme.name}
                            </div>
                            {currentTheme === theme.id && (
                                <Check size={14} className="text-blue-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
