"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Upload, PenTool, User, HelpCircle } from 'lucide-react';

export default function FloatingActionButton() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        {
            icon: <PenTool className="w-5 h-5" />,
            label: 'Build Resume',
            onClick: () => router.push('/resume/build'),
            color: 'from-purple-600 to-purple-700',
        },
        {
            icon: <Upload className="w-5 h-5" />,
            label: 'Upload Resume',
            onClick: () => router.push('/resume/upload'),
            color: 'from-green-600 to-green-700',
        },
        {
            icon: <User className="w-5 h-5" />,
            label: 'View Profile',
            onClick: () => router.push('/profile'),
            color: 'from-blue-600 to-blue-700',
        },
        {
            icon: <HelpCircle className="w-5 h-5" />,
            label: 'Get Help',
            onClick: () => router.push('/help'),
            color: 'from-gray-600 to-gray-700',
        },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Action Menu */}
            <div
                className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
            >
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            setIsOpen(false);
                        }}
                        className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all pr-4 pl-3 py-3 border border-gray-200 dark:border-gray-700"
                        style={{
                            transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                        }}
                    >
                        <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                            {action.icon}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 ${isOpen ? 'rotate-45' : 'rotate-0'
                    }`}
                aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
        </div>
    );
}
