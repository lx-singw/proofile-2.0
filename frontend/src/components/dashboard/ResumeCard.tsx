'use client';

import React from 'react';
import { FileText, Download, Edit, Trash2, Calendar, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface ResumeCardProps {
    id: string;
    name: string;
    template_id: string;
    updated_at: string;
    onExport?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const TEMPLATE_NAMES: Record<string, string> = {
    modern: 'Executive',
    creative: 'Creative',
    minimal: 'Tech Minimalist',
};

export default function ResumeCard({ id, name, template_id, updated_at, onExport, onDelete }: ResumeCardProps) {
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-emerald-500 dark:hover:border-emerald-400 transition-all">
            {/* Template Badge */}
            <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                    {TEMPLATE_NAMES[template_id] || template_id}
                </span>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
            </div>

            {/* Resume Name */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 pr-20">
                {name}
            </h3>

            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4" />
                <span>Updated {formatDate(updated_at)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Link
                    href={`/resume/build?id=${id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                </Link>

                <button
                    onClick={() => onExport?.(id)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                    title="Export"
                >
                    <Download className="w-4 h-4" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                        title="More options"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10">
                            <button
                                onClick={() => {
                                    onDelete?.(id);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
