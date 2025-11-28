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

export default function ModernTemplate({ data }: TemplateProps) {
    return (
        <div className="bg-white p-12 shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Header */}
            <div className="border-b-4 border-blue-600 pb-6 mb-6">
                <h1 className="text-4xl font-bold text-gray-900">{data.personal?.name || 'Your Name'}</h1>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    {data.personal?.email && <span>{data.personal.email}</span>}
                    {data.personal?.phone && <span>•</span>}
                    {data.personal?.phone && <span>{data.personal.phone}</span>}
                    {data.personal?.location && <span>•</span>}
                    {data.personal?.location && <span>{data.personal.location}</span>}
                </div>
            </div>

            {/* Summary */}
            {data.personal?.summary && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-600 mb-2">Professional Summary</h2>
                    <p className="text-gray-700 leading-relaxed">{data.personal.summary}</p>
                </div>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-600 mb-3">Experience</h2>
                    {data.experience.map((exp, idx) => (
                        <div key={idx} className="mb-4">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                                <span className="text-sm text-gray-600">
                                    {exp.startDate} - {exp.endDate || 'Present'}
                                </span>
                            </div>
                            <p className="text-gray-700 font-medium">{exp.company}</p>
                            <p className="text-gray-600 mt-1">{exp.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-blue-600 mb-3">Education</h2>
                    {data.education.map((edu, idx) => (
                        <div key={idx} className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                                <span className="text-sm text-gray-600">{edu.graduationDate}</span>
                            </div>
                            <p className="text-gray-700">{edu.institution}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-blue-600 mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills.map((skill, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
