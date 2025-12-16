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

export default function ClassicTemplate({ data }: TemplateProps) {
    return (
        <div className="bg-white p-12 shadow-lg font-serif" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.personal?.name || 'Your Name'}</h1>
                <div className="text-sm text-gray-700 space-x-2">
                    {data.personal?.email && <span>{data.personal.email}</span>}
                    {data.personal?.phone && <span>|</span>}
                    {data.personal?.phone && <span>{data.personal.phone}</span>}
                    {data.personal?.location && <span>|</span>}
                    {data.personal?.location && <span>{data.personal.location}</span>}
                </div>
            </div>

            {/* Summary */}
            {data.personal?.summary && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">Summary</h2>
                    <p className="text-gray-800 leading-relaxed text-justify">{data.personal.summary}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Professional Experience</h2>
                    {data.experience.map((exp, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="flex justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{exp.position}</h3>
                                    <p className="italic text-gray-700">{exp.company}</p>
                                </div>
                                <span className="text-sm text-gray-700">
                                    {exp.startDate} - {exp.endDate || 'Present'}
                                </span>
                            </div>
                            <p className="text-gray-700 mt-2 text-justify">{exp.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Education</h2>
                    {data.education.map((edu, idx) => (
                        <div key={idx} className="mb-3">
                            <div className="flex justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{edu.degree} in {edu.field}</h3>
                                    <p className="italic text-gray-700">{edu.institution}</p>
                                </div>
                                <span className="text-sm text-gray-700">{edu.graduationDate}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">Skills</h2>
                    <p className="text-gray-800">{data.skills.join(' • ')}</p>
                </div>
            )}
        </div>
    );
}
