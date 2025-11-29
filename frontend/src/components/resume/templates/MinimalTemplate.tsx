'use client';

import React from 'react';
import { Mail, Github, MapPin, Linkedin, Terminal, Code2, Cpu } from 'lucide-react';
import { ResumeData } from '.';
import { ColorScheme } from '@/app/resume/build/components/ThemeSwitcher';

interface TemplateProps {
    data: ResumeData;
    theme?: ColorScheme;
}

const THEME_CONFIG: Record<ColorScheme, { primary: string; accent: string; bg: string; text: string }> = {
    slate: { primary: '#0f172a', accent: '#3b82f6', bg: '#f1f5f9', text: '#334155' },
    navy: { primary: '#1e3a8a', accent: '#d97706', bg: '#f3f4f6', text: '#1e293b' },
    charcoal: { primary: '#18181b', accent: '#10b981', bg: '#f4f4f5', text: '#27272a' },
    burgundy: { primary: '#881337', accent: '#f59e0b', bg: '#fdf2f8', text: '#4a044e' },
    forest: { primary: '#14532d', accent: '#84cc16', bg: '#f0fdf4', text: '#14532d' },
};

export default function MinimalTemplate({ data, theme = 'charcoal' }: TemplateProps) {
    const colors = THEME_CONFIG[theme];

    return (
        <div className="bg-white shadow-2xl min-h-[297mm] w-[210mm] overflow-hidden font-mono text-sm text-slate-800 p-12">
            {/* Header */}
            <header className="border-b-2 pb-8 mb-8" style={{ borderColor: colors.primary }}>
                <h1
                    className="text-4xl font-bold tracking-tight mb-2"
                    style={{ color: colors.primary, fontFamily: 'var(--font-mono)' }}
                >
                    {data.personal?.name || 'ALEX DEVELOPER'}
                </h1>
                <p className="text-lg mb-4" style={{ color: colors.accent }}>
                    {data.personal?.title || 'Full Stack Engineer'}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    {data.personal?.email && (
                        <div className="flex items-center gap-2">
                            <span style={{ color: colors.accent }}>➜</span>
                            {data.personal.email}
                        </div>
                    )}
                    {data.personal?.phone && (
                        <div className="flex items-center gap-2">
                            <span style={{ color: colors.accent }}>➜</span>
                            {data.personal.phone}
                        </div>
                    )}
                    {data.personal?.location && (
                        <div className="flex items-center gap-2">
                            <span style={{ color: colors.accent }}>➜</span>
                            {data.personal.location}
                        </div>
                    )}
                    {data.personal?.website && (
                        <div className="flex items-center gap-2">
                            <span style={{ color: colors.accent }}>➜</span>
                            {data.personal.website}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-10">

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h3
                            className="text-base font-bold uppercase tracking-wider mb-6 flex items-center gap-2"
                            style={{ color: colors.primary }}
                        >
                            <Terminal size={16} />
                            Experience
                        </h3>
                        <div className="space-y-8">
                            {data.experience.map((exp, idx) => (
                                <div key={idx} className="relative pl-4 border-l" style={{ borderColor: colors.bg }}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-base" style={{ color: colors.primary }}>
                                            {exp.position}
                                        </h4>
                                        <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: colors.bg }}>
                                            {exp.startDate} — {exp.endDate || 'Present'}
                                        </span>
                                    </div>
                                    <div className="mb-2 font-medium" style={{ color: colors.accent }}>
                                        @ {exp.company}
                                    </div>
                                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Technical Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h3
                            className="text-base font-bold uppercase tracking-wider mb-6 flex items-center gap-2"
                            style={{ color: colors.primary }}
                        >
                            <Cpu size={16} />
                            Technical Skills
                        </h3>
                        <div className="p-6 rounded-lg border" style={{ borderColor: colors.bg, backgroundColor: '#fafafa' }}>
                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                                {data.skills.map((skill, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span style={{ color: colors.accent }}>$</span>
                                        <span className="font-medium">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h3
                            className="text-base font-bold uppercase tracking-wider mb-6 flex items-center gap-2"
                            style={{ color: colors.primary }}
                        >
                            <Code2 size={16} />
                            Education
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.education.map((edu, idx) => (
                                <div key={idx} className="border p-4 rounded" style={{ borderColor: colors.bg }}>
                                    <div className="font-bold" style={{ color: colors.primary }}>{edu.institution}</div>
                                    <div className="text-xs mt-1" style={{ color: colors.accent }}>{edu.degree}</div>
                                    <div className="text-xs mt-2 text-slate-500">{edu.graduationDate}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
