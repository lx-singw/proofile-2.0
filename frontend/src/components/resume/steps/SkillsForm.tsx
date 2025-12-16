'use client';

import React, { useState } from 'react';
import { ResumeData } from '../templates';
import { Plus, X } from 'lucide-react';

interface SkillsFormProps {
    data: ResumeData['skills'];
    onChange: (skills: ResumeData['skills']) => void;
}

export default function SkillsForm({ data = [], onChange }: SkillsFormProps) {
    const [inputValue, setInputValue] = useState('');

    const addSkill = () => {
        if (inputValue.trim()) {
            onChange([...data, inputValue.trim()]);
            setInputValue('');
        }
    };

    const removeSkill = (index: number) => {
        onChange(data.filter((_, i) => i !== index));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Skills</h2>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Type a skill and press Enter or click Add"
                />
                <button
                    onClick={addSkill}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </button>
            </div>

            {data.length === 0 && (
                <p className="text-gray-500 text-center py-8">No skills added yet. Add your skills above.</p>
            )}

            <div className="flex flex-wrap gap-2">
                {data.map((skill, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full"
                    >
                        <span>{skill}</span>
                        <button
                            onClick={() => removeSkill(index)}
                            className="hover:text-emerald-900"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
