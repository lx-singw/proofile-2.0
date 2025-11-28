import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import MinimalTemplate from './MinimalTemplate';

export interface ResumeData {
    personal?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        summary?: string;
    };
    experience?: Array<{
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        description: string;
    }>;
    education?: Array<{
        institution: string;
        degree: string;
        field: string;
        graduationDate: string;
    }>;
    skills?: string[];
}

export interface Template {
    id: string;
    name: string;
    description: string;
    component: React.ComponentType<{ data: ResumeData }>;
    thumbnail: string;
}

export const templates: Template[] = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and contemporary design with accent colors',
        component: ModernTemplate,
        thumbnail: '/templates/modern-thumb.png',
    },
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional serif layout for formal applications',
        component: ClassicTemplate,
        thumbnail: '/templates/classic-thumb.png',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Spacious and elegant with focus on content',
        component: MinimalTemplate,
        thumbnail: '/templates/minimal-thumb.png',
    },
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find((t) => t.id === id);
}
