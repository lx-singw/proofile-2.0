import ModernTemplate from './ModernTemplate';
import CreativeTemplate from './CreativeTemplate';
import MinimalTemplate from './MinimalTemplate';

export interface ResumeData {
    personal?: {
        name?: string;
        title?: string;
        email?: string;
        phone?: string;
        location?: string;
        linkedin?: string;
        website?: string;
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
    component: React.ComponentType<{ data: ResumeData; theme?: any }>;
    thumbnail: string;
}

export const templates: Template[] = [
    {
        id: 'modern',
        name: 'Executive',
        description: 'Professional two-column layout for corporate roles',
        component: ModernTemplate,
        thumbnail: '/templates/modern-thumb.png',
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Bold typography and unique layout for designers',
        component: CreativeTemplate,
        thumbnail: '/templates/creative-thumb.png',
    },
    {
        id: 'minimal',
        name: 'Tech Minimalist',
        description: 'Clean, code-inspired layout for developers',
        component: MinimalTemplate,
        thumbnail: '/templates/minimal-thumb.png',
    },
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find((t) => t.id === id);
}
