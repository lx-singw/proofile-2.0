'use client';

import React from 'react';
import { ResumeData } from '../templates';
import { Plus, Trash2 } from 'lucide-react';

interface EducationFormProps {
    data: ResumeData['education'];
    onChange: (education: ResumeData['education']) => void;
}

export default function EducationForm({ data = [], onChange }: EducationFormProps) {
    const addEducation = () => {
        onChange([...data, { institution: '', degree: '', field: '', graduationDate: '' }]);
    };

    const removeEducation = (index: number) => {
        onChange(data.filter((_, i) => i !== index));
    };

    const updateEducation = (index: number, field: string, value: string) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Education</h2>
                <button
                    onClick={addEducation}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Education
                </button>
            </div>

            {data.length === 0 && (
                <p className="text-gray-500 text-center py-8">No education added yet. Click "Add Education" to get started.</p>
            )}

            {data.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 relative">
                    <button
                        onClick={() => removeEducation(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                            <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Bachelor of Science"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                            <input
                                type="text"
                                value={edu.field}
                                onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Computer Science"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                            <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="University Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
                            <input
                                type="text"
                                value={edu.graduationDate}
                                onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="May 2020"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
