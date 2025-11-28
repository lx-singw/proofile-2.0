'use client';

import React from 'react';
import { getTemplateById, ResumeData } from './templates';

interface LivePreviewProps {
    templateId: string;
    data: ResumeData;
}

export default function LivePreview({ templateId, data }: LivePreviewProps) {
    const template = getTemplateById(templateId);

    if (!template) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <p className="text-gray-500">Select a template to preview</p>
            </div>
        );
    }

    const TemplateComponent = template.component;

    return (
        <div className="bg-gray-100 p-8 rounded-lg overflow-auto" style={{ maxHeight: '90vh' }}>
            <div className="mx-auto shadow-2xl" style={{ width: '210mm', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                <TemplateComponent data={data} />
            </div>
        </div>
    );
}
