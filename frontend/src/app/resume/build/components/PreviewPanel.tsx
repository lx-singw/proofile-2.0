'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Eye, Download } from 'lucide-react';
import LivePreview from '@/components/resume/LivePreview';
import { ResumeData } from '@/components/resume/templates';

import { ColorScheme } from './ThemeSwitcher';

interface PreviewPanelProps {
    data: ResumeData;
    templateId: string;
    theme: ColorScheme;
}

export default function PreviewPanel({ data, templateId, theme }: PreviewPanelProps) {
    const [zoom, setZoom] = useState(75);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 150));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

    return (
        <div className="flex-1 bg-gray-100/50 relative flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 hover:bg-white rounded-md text-gray-500 hover:text-gray-900 transition-all shadow-sm hover:shadow"
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-xs font-medium w-12 text-center text-gray-600">{zoom}%</span>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 hover:bg-white rounded-md text-gray-500 hover:text-gray-900 transition-all shadow-sm hover:shadow"
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Fullscreen">
                        <Maximize2 size={16} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Preview Mode">
                        <Eye size={16} />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100">
                <div
                    className="origin-top transition-transform duration-200 ease-out shadow-2xl"
                    style={{
                        transform: `scale(${zoom / 100})`,
                        marginBottom: `${(zoom / 100) * 100}px` // Add margin to allow scrolling to bottom when zoomed
                    }}
                >
                    <LivePreview templateId={templateId} data={data} theme={theme} />
                </div>
            </div>

            {/* Floating Action Button (Mobile) */}
            <button className="lg:hidden absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-colors z-20">
                <Eye size={24} />
            </button>
        </div>
    );
}
