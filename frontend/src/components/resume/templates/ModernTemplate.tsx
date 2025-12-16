'use client';

import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Award } from 'lucide-react';
import { ColorScheme } from '@/app/resume/build/components/ThemeSwitcher';
import { ResumeData } from '.';

interface TemplateProps {
    data: ResumeData;
    theme?: ColorScheme;
}

const THEME_CONFIG: Record<ColorScheme, { primary: string; accent: string; sidebarBg: string; text: string }> = {
    slate: { primary: '#0f172a', accent: '#3b82f6', sidebarBg: '#f8fafc', text: '#334155' },
    navy: { primary: '#1e3a8a', accent: '#d97706', sidebarBg: '#fffbeb', text: '#1e293b' },
    charcoal: { primary: '#1f2937', accent: '#14b8a6', sidebarBg: '#f0fdfa', text: '#374151' },
    burgundy: { primary: '#881337', accent: '#f59e0b', sidebarBg: '#fef3c7', text: '#4a044e' },
    forest: { primary: '#14532d', accent: '#84cc16', sidebarBg: '#f7fee7', text: '#14532d' },
};

export default function ModernTemplate({ data, theme = 'slate' }: TemplateProps) {
    const colors = THEME_CONFIG[theme];

    return (
        <div className="bg-white shadow-2xl flex flex-col md:flex-row min-h-[297mm] w-[210mm] overflow-hidden font-sans text-slate-700">
            {/* Left Sidebar (30%) */}
            <div
                className="w-[32%] border-r p-8 flex flex-col gap-8 transition-colors duration-300"
                style={{ backgroundColor: colors.sidebarBg, borderColor: `${colors.primary}20` }}
            >
                {/* Contact Info */}
                <div className="space-y-4">
                    <h3
                        className="text-xs font-bold uppercase tracking-widest mb-4 border-b pb-2"
                        style={{ color: `${colors.primary}80`, borderColor: `${colors.primary}20` }}
                    >
                        Contact
                    </h3>

                    {[
                        { icon: Mail, value: data.personal?.email },
                        { icon: Phone, value: data.personal?.phone },
                        {
                            icon: MapPin,
                            value: [
                                data.personal?.address,
                                data.personal?.city,
                                data.personal?.state,
                                data.personal?.postalCode,
                                data.personal?.country
                            ].filter(Boolean).join(', ') || data.personal?.location
                        },
                        { icon: Linkedin, value: data.personal?.linkedin },
                        { icon: Globe, value: data.personal?.website },
                    ].map((item, idx) => item.value && (
                        <div key={idx} className="flex items-center gap-3 text-sm group">
                            <div
                                className="w-8 h-8 rounded-full bg-white border flex items-center justify-center shadow-sm transition-colors"
                                style={{ color: colors.accent, borderColor: `${colors.primary}20` }}
                            >
                                <item.icon size={14} />
                            </div>
                            <span className="break-all text-slate-600">{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <div className="space-y-4">
                        <h3
                            className="text-xs font-bold uppercase tracking-widest mb-4 border-b pb-2"
                            style={{ color: `${colors.primary}80`, borderColor: `${colors.primary}20` }}
                        >
                            Education
                        </h3>
                        {data.education.map((edu, idx) => (
                            <div key={idx} className="mb-4 last:mb-0">
                                <div className="font-bold text-slate-800">{edu.institution}</div>
                                <div className="text-sm font-medium" style={{ color: colors.accent }}>{edu.degree}</div>
                                <div className="text-xs text-slate-500 mt-1">{edu.graduationDate}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <div className="space-y-4">
                        <h3
                            className="text-xs font-bold uppercase tracking-widest mb-4 border-b pb-2"
                            style={{ color: `${colors.primary}80`, borderColor: `${colors.primary}20` }}
                        >
                            Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-white border rounded text-xs font-medium shadow-sm"
                                    style={{ color: colors.text, borderColor: `${colors.primary}20` }}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content (70%) */}
            <div className="flex-1 p-10 flex flex-col gap-8">
                {/* Header Section */}
                <div className="border-b-2 pb-8" style={{ borderColor: `${colors.primary}10` }}>
                    <h1
                        className="text-5xl font-serif font-bold tracking-tight mb-2"
                        style={{ color: colors.primary, fontFamily: 'var(--font-playfair)' }}
                    >
                        {data.personal?.name || 'Your Name'}
                    </h1>
                    <p
                        className="text-xl font-medium tracking-wide uppercase"
                        style={{ color: colors.accent }}
                    >
                        {data.personal?.title || 'Professional Title'}
                    </p>
                </div>

                {/* Summary */}
                {data.personal?.summary && (
                    <div>
                        <h3
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-4"
                            style={{ color: colors.primary }}
                        >
                            <span className="w-1 h-4 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                            Professional Summary
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-justify">
                            {data.personal.summary}
                        </p>
                    </div>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <div className="flex-1">
                        <h3
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-6"
                            style={{ color: colors.primary }}
                        >
                            <span className="w-1 h-4 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                            Experience
                        </h3>
                        <div className="space-y-8">
                            {data.experience.map((exp, idx) => (
                                <div
                                    key={idx}
                                    className="relative pl-6 border-l-2 last:border-0"
                                    style={{ borderColor: `${colors.primary}10` }}
                                >
                                    <div
                                        className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4"
                                        style={{ borderColor: `${colors.accent}40` }}
                                    >
                                        <div className="w-2 h-2 rounded-full m-auto mt-[2px]" style={{ backgroundColor: colors.accent }}></div>
                                    </div>

                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-lg font-bold" style={{ color: colors.primary }}>{exp.position}</h4>
                                        <span className="text-sm font-medium px-2 py-1 rounded bg-slate-50 text-slate-500">
                                            {exp.startDate} - {exp.endDate || 'Present'}
                                        </span>
                                    </div>

                                    <div className="font-medium mb-3 flex items-center gap-2" style={{ color: colors.accent }}>
                                        <Briefcase size={14} />
                                        {exp.company}
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                        {exp.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
