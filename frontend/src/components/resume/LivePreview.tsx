'use client';

import React from 'react';
import ModernTemplate from './templates/ModernTemplate';
import CreativeTemplate from './templates/CreativeTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import { ResumeData } from './templates';
import { ColorScheme } from '@/app/resume/build/components/ThemeSwitcher';

interface LivePreviewProps {
    templateId: string;
    data: ResumeData;
    theme?: ColorScheme;
}

export default function LivePreview({ templateId, data, theme }: LivePreviewProps) {
    const renderTemplate = () => {
        switch (templateId) {
            case 'modern':
                return <ModernTemplate data={data} theme={theme} />;
            case 'creative':
                return <CreativeTemplate data={data} theme={theme} />;
            case 'minimal':
                return <MinimalTemplate data={data} theme={theme} />;
            default:
                return <ModernTemplate data={data} theme={theme} />;
        }
    };

    return (
        <div className="bg-white shadow-lg">
            {renderTemplate()}
        </div>
    );
}
