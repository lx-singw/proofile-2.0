'use client';

import React from 'react';

interface ResumeData {
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

interface TemplateProps {
    data: ResumeData;
}

export default function MinimalTemplate({ data }: TemplateProps) {
    return (
        <div className="bg-white p-16 shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-5xl font-light text-gray-900 mb-1">{data.personal?.name || 'Your Name'}</h1>
                <div className="text-xs text-gray-500 space-x-3 mt-2">
                    {data.personal?.email && <span>{data.personal.email}</span>}
                    {data.personal?.phone && <span>{data.personal.phone}</span>}
                    {data.personal?.location && <span>{data.personal.location}</span>}
                </div>
            </div>

            {/* Summary */}
            {data.personal?.summary && (
                <div className="mb-10">
                    <p className="text-gray-700 leading-loose">{data.personal.summary}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Experience</h2>
                    {data.experience.map((exp, idx) => (
                        <div key={idx} className="mb-6">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-medium text-gray-900">{exp.position}</h3>
                                <span className="text-xs text-gray-500">
                                    {exp.startDate} — {exp.endDate || 'Present'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{exp.company}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Education</h2>
                    {data.education.map((edu, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h3>
                                <span className="text-xs text-gray-500">{edu.graduationDate}</span>
                            </div>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Skills</h2>
                    <p className="text-sm text-gray-700">{data.skills.join(', ')}</p>
                </div>
            )}
        </div>
    );
}
