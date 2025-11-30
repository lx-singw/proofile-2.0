'use client';

import React from 'react';
import { Mail, Globe, MapPin, Linkedin, Award, GraduationCap, Palette, Phone } from 'lucide-react';
import { ResumeData } from '.';
import { ColorScheme } from '@/app/resume/build/components/ThemeSwitcher';

interface TemplateProps {
    data: ResumeData;
    theme?: ColorScheme;
}

const THEME_CONFIG: Record<ColorScheme, { primary: string; accent: string; bg: string; text: string }> = {
    slate: { primary: '#0f172a', accent: '#3b82f6', bg: '#f8fafc', text: '#334155' },
    navy: { primary: '#1e3a8a', accent: '#d97706', bg: '#fffbeb', text: '#1e293b' },
    charcoal: { primary: '#1f2937', accent: '#14b8a6', bg: '#f0fdfa', text: '#374151' },
    burgundy: { primary: '#881337', accent: '#f59e0b', bg: '#fef3c7', text: '#4a044e' },
    forest: { primary: '#14532d', accent: '#84cc16', bg: '#f7fee7', text: '#14532d' },
};

export default function CreativeTemplate({ data, theme = 'slate' }: TemplateProps) {
    const colors = THEME_CONFIG[theme];

    return (
        <div className="bg-white shadow-2xl min-h-[297mm] w-[210mm] overflow-hidden font-sans text-slate-700 flex flex-col">
            {/* Header */}
            <div className="p-12 pb-8 text-center">
                <h1
                    className="text-6xl font-bold tracking-tighter mb-4 uppercase"
                    style={{ color: colors.primary, fontFamily: 'var(--font-playfair)' }}
                >
                    {data.personal?.name || 'Your Name'}
                </h1>
                <p
                    className="text-xl font-medium tracking-widest uppercase mb-8"
                    style={{ color: colors.accent }}
                >
                    {data.personal?.title || 'Creative Professional'}
                </p>

                <div className="flex flex-wrap justify-center gap-6 text-sm font-medium" style={{ color: colors.text }}>
                    {data.personal?.email && (
                        <div className="flex items-center gap-2">
                            <Mail size={14} style={{ color: colors.accent }} />
                            {data.personal.email}
                        </div>
                    )}
                    {data.personal?.phone && (
                        <div className="flex items-center gap-2">
                            <Phone size={14} style={{ color: colors.accent }} />
                            {data.personal.phone}
                        </div>
                    )}
                    {data.personal?.website && (
                        <div className="flex items-center gap-2">
                            <Globe size={14} style={{ color: colors.accent }} />
                            {data.personal.website}
                        </div>
                    )}
                    {data.personal?.address && (
                        <div className="flex items-center gap-2">
                            <MapPin size={14} style={{ color: colors.accent }} />
                            {[
                                data.personal?.address,
                                data.personal?.city,
                                data.personal?.state,
                                data.personal?.postalCode,
                                data.personal?.country
                            ].filter(Boolean).join(', ')}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-12 pt-4 grid grid-cols-12 gap-12">
                {/* Left Column (Main) */}
                <div className="col-span-8 flex flex-col gap-10">
                    {/* Creative Philosophy / Summary */}
                    {data.personal?.summary && (
                        <div className="relative">
                            <h3
                                className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
                                style={{ color: colors.primary }}
                            >
                                <Palette size={16} />
                                Creative Philosophy
                            </h3>
                            <p className="text-lg leading-relaxed italic" style={{ color: colors.text }}>
                                "{data.personal.summary}"
                            </p>
                        </div>
                    )}

                    {/* Experience */}
                    {data.experience && data.experience.length > 0 && (
                        <div>
                            <h3
                                className="text-sm font-bold uppercase tracking-widest mb-6 border-b-2 pb-2"
                                style={{ color: colors.primary, borderColor: colors.accent }}
                            >
                                Experience
                            </h3>
                            <div className="space-y-8">
                                {data.experience.map((exp, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h4 className="text-xl font-bold" style={{ color: colors.primary }}>
                                                {exp.position}
                                            </h4>
                                            <span className="text-sm font-medium" style={{ color: colors.accent }}>
                                                {exp.startDate} - {exp.endDate || 'Present'}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: colors.text }}>
                                            {exp.company}
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                                            {exp.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Sidebar) */}
                <div className="col-span-4 flex flex-col gap-10">
                    {/* Education */}
                    {data.education && data.education.length > 0 && (
                        <div className="p-6 rounded-2xl" style={{ backgroundColor: colors.bg }}>
                            <h3
                                className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"
                                style={{ color: colors.primary }}
                            >
                                <GraduationCap size={16} />
                                Education
                            </h3>
                            <div className="space-y-6">
                                {data.education.map((edu, idx) => (
                                    <div key={idx}>
                                        <div className="font-bold text-base" style={{ color: colors.primary }}>
                                            {edu.institution}
                                        </div>
                                        <div className="text-sm mt-1" style={{ color: colors.accent }}>
                                            {edu.degree}
                                        </div>
                                        <div className="text-xs mt-1 opacity-75" style={{ color: colors.text }}>
                                            {edu.graduationDate}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {data.skills && data.skills.length > 0 && (
                        <div>
                            <h3
                                className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"
                                style={{ color: colors.primary }}
                            >
                                <Award size={16} />
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 border-2 rounded-lg text-xs font-bold uppercase tracking-wide"
                                        style={{
                                            borderColor: colors.primary,
                                            color: colors.primary,
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
