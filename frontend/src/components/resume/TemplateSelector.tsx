'use client';

import React from 'react';
import { templates, Template } from './templates';
import { Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplateSelector({ selectedTemplateId, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`relative group border-2 rounded-lg p-4 transition-all hover:shadow-lg ${selectedTemplateId === template.id
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
              }`}
          >
            {selectedTemplateId === template.id && (
              <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
            <div className="aspect-[210/297] bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400 text-sm">
              Preview
            </div>
            <h3 className="font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
