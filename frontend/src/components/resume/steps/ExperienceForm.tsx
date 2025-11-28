'use client';

import React from 'react';
import { ResumeData } from '../templates';
import { Plus, Trash2 } from 'lucide-react';

interface ExperienceFormProps {
    data: ResumeData['experience'];
    onChange: (experience: ResumeData['experience']) => void;
}

export default function ExperienceForm({ data = [], onChange }: ExperienceFormProps) {
    const addExperience = () => {
        onChange([...data, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
    };

    const removeExperience = (index: number) => {
        onChange(data.filter((_, i) => i !== index));
    };

    const updateExperience = (index: number, field: string, value: string) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Work Experience</h2>
                <button
                    onClick={addExperience}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Experience
                </button>
            </div>

            {data.length === 0 && (
                <p className="text-gray-500 text-center py-8">No experience added yet. Click "Add Experience" to get started.</p>
            )}

            {data.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 relative">
                    <button
                        onClick={() => removeExperience(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <input
                                type="text"
                                value={exp.position}
                                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Tech Corp"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="text"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Jan 2020"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="text"
                                value={exp.endDate || ''}
                                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Present"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(index, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe your responsibilities and achievements..."
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
