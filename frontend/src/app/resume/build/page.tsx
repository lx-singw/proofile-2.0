'use client';

import React, { useState, useEffect } from 'react';
import { resumeService } from '@/services/resumeService';
import { ResumeData } from '@/components/resume/templates';
import BuilderHeader from './components/BuilderHeader';
import ProgressStepper from './components/ProgressStepper';
import PreviewPanel from './components/PreviewPanel';
import AISuggestions from './components/AISuggestions';
import { ColorScheme } from './components/ThemeSwitcher';
import PersonalInfoForm from '@/components/resume/steps/PersonalInfoForm';
import ExperienceForm from '@/components/resume/steps/ExperienceForm';
import EducationForm from '@/components/resume/steps/EducationForm';
import SkillsForm from '@/components/resume/steps/SkillsForm';
import SummaryForm from '@/components/resume/steps/SummaryForm';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
    { id: 'personal', title: 'Personal Info' },
    { id: 'experience', title: 'Experience' },
    { id: 'education', title: 'Education' },
    { id: 'skills', title: 'Skills' },
    { id: 'summary', title: 'Summary' },
];

export default function ResumeBuilderPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [currentTheme, setCurrentTheme] = useState<ColorScheme>('slate');
    const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
    const [resumeData, setResumeData] = useState<ResumeData>({
        personal: {
            name: 'John Davidson',
            title: 'Senior Product Manager',
            email: 'john@example.com',
            phone: '(555) 123-4567',
            location: 'New York, NY',
            linkedin: 'linkedin.com/in/johndoe',
            website: 'johndoe.com',
            summary: 'Accomplished product leader with 8+ years of experience driving product strategy and execution. Proven track record of launching successful products and leading cross-functional teams.'
        },
        experience: [
            {
                company: 'TechCorp Inc.',
                position: 'Senior Product Manager',
                startDate: 'Jan 2020',
                endDate: 'Present',
                description: '• Led a cross-functional team of 15 engineers and designers to launch the company\'s flagship product.\n• Increased user engagement by 45% through data-driven feature optimization.\n• Managed a $2M annual product budget and roadmap.'
            },
            {
                company: 'StartupXYZ',
                position: 'Product Manager',
                startDate: 'Mar 2018',
                endDate: 'Dec 2019',
                description: '• Launched 3 major features that contributed to a 30% increase in ARR.\n• Conducted user research and usability testing to inform product decisions.'
            }
        ],
        education: [
            {
                institution: 'Harvard University',
                degree: 'MBA',
                field: 'Business Administration',
                graduationDate: '2018'
            },
            {
                institution: 'MIT',
                degree: 'BS',
                field: 'Computer Science',
                graduationDate: '2015'
            }
        ],
        skills: ['Product Management', 'Agile/Scrum', 'Data Analysis', 'Python', 'SQL', 'User Research', 'Strategic Planning'],
    });

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentResumeId) {
                handleSave(true);
            }
        }, 30000);
        return () => clearTimeout(timer);
    }, [resumeData]);

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        try {
            const resumeName = resumeData.personal?.name || 'My Resume';

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            setLastSaved(new Date());
            if (!silent) {
                // alert('Saved!'); 
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        // Implement export logic
        alert('Exporting PDF...');
    };

    const renderStepContent = () => {
        switch (STEPS[currentStep].id) {
            case 'personal':
                return (
                    <PersonalInfoForm
                        data={resumeData.personal}
                        onChange={(personal) => setResumeData({ ...resumeData, personal })}
                    />
                );
            case 'experience':
                return (
                    <ExperienceForm
                        data={resumeData.experience}
                        onChange={(experience) => setResumeData({ ...resumeData, experience })}
                    />
                );
            case 'education':
                return (
                    <EducationForm
                        data={resumeData.education}
                        onChange={(education) => setResumeData({ ...resumeData, education })}
                    />
                );
            case 'skills':
                return (
                    <SkillsForm
                        data={resumeData.skills}
                        onChange={(skills) => setResumeData({ ...resumeData, skills })}
                    />
                );
            case 'summary':
                return (
                    <SummaryForm
                        data={resumeData.personal?.summary}
                        onChange={(summary) => setResumeData({
                            ...resumeData,
                            personal: { ...resumeData.personal, summary }
                        })}
                    />
                );
            default:
                return (
                    <div className="p-8 text-center text-gray-500">
                        Section content coming soon...
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <BuilderHeader
                lastSaved={lastSaved}
                onSave={() => handleSave()}
                onExport={handleExport}
                isSaving={isSaving}
                currentTheme={currentTheme}
                onThemeChange={setCurrentTheme}
                currentTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
            />

            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar: Navigation */}
                <ProgressStepper
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                    completedSteps={[0, 1]} // Example completed steps
                />

                {/* Middle: Editor Form */}
                <div className="flex-1 overflow-y-auto bg-white border-r border-gray-200 max-w-2xl shadow-sm z-10">
                    <div className="p-8 pb-32">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{STEPS[currentStep].title}</h2>
                            <p className="text-gray-500">
                                Fill in the details below. They will automatically update in the preview.
                            </p>
                        </div>

                        {renderStepContent()}

                        <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
                            <button
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                <ChevronLeft size={18} />
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                                disabled={currentStep === STEPS.length - 1}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all hover:shadow"
                            >
                                Next Step
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Live Preview */}
                <PreviewPanel
                    data={resumeData}
                    templateId={selectedTemplate}
                    theme={currentTheme}
                />

                {/* AI Suggestions Overlay */}
                <AISuggestions />
            </main>
        </div>
    );
}
