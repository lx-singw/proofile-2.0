import React, { useState } from 'react';
import { X, Sparkles, Target, FileText, AlignLeft, RefreshCw } from 'lucide-react';

interface AIImproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImprove: (action: string, params?: any) => void;
}

export default function AIImproveModal({ isOpen, onClose, onImprove }: AIImproveModalProps) {
    if (!isOpen) return null;

    const options = [
        {
            id: 'summary',
            icon: <FileText className="h-5 w-5 text-blue-600" />,
            title: 'Enhance Professional Summary',
            description: 'Make your summary more compelling and impactful.'
        },
        {
            id: 'bullets',
            icon: <AlignLeft className="h-5 w-5 text-green-600" />,
            title: 'Strengthen Bullet Points',
            description: 'Add more action verbs and quantifiable results.'
        },
        {
            id: 'keywords',
            icon: <Target className="h-5 w-5 text-purple-600" />,
            title: 'Optimize Keywords',
            description: 'Target a specific job description.'
        },
        {
            id: 'regenerate',
            icon: <RefreshCw className="h-5 w-5 text-orange-600" />,
            title: 'Complete Regeneration',
            description: 'Start over with a different approach.'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">AI Enhancement Options</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-500 mb-2">Choose what you'd like to improve:</p>
                    
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onImprove(option.id)}
                            className="w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                        >
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                                {option.icon}
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{option.title}</h3>
                                <p className="text-sm text-gray-500">{option.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
