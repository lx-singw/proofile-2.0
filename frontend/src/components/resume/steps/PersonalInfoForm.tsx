'use client';

import React from 'react';
import { ResumeData } from '../templates';

interface PersonalInfoFormProps {
    data: ResumeData['personal'];
    onChange: (personal: ResumeData['personal']) => void;
}

export default function PersonalInfoForm({ data = {}, onChange }: PersonalInfoFormProps) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                    type="tel"
                    value={data.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                    type="text"
                    value={data.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York, NY"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                <textarea
                    value={data.summary || ''}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="A brief summary of your professional background and goals..."
                />
            </div>
        </div>
    );
}
