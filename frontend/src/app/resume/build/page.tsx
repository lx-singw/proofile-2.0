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

import { EXAMPLE_RESUME_DATA } from '@/components/resume/templates/exampleData';

export default function ResumeBuilderPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [currentTheme, setCurrentTheme] = useState<ColorScheme>('slate');
    const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);

    // Initialize with empty data so progress starts at 0%
    const [resumeData, setResumeData] = useState<ResumeData>({
        personal: {},
        experience: [],
        education: [],
        skills: [],
    });

    // Calculate preview data: use example data if user hasn't started a section
    const previewData = React.useMemo(() => {
        const hasPersonal = Object.keys(resumeData.personal || {}).length > 0;
        const hasExperience = (resumeData.experience?.length ?? 0) > 0;
        const hasEducation = (resumeData.education?.length ?? 0) > 0;
        const hasSkills = (resumeData.skills?.length ?? 0) > 0;

        return {
            personal: hasPersonal ? resumeData.personal : EXAMPLE_RESUME_DATA.personal,
            experience: hasExperience ? resumeData.experience : EXAMPLE_RESUME_DATA.experience,
            education: hasEducation ? resumeData.education : EXAMPLE_RESUME_DATA.education,
            skills: hasSkills ? resumeData.skills : EXAMPLE_RESUME_DATA.skills,
        };
    }, [resumeData]);

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

    const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
        // Implement export logic based on format
        const formatNames = {
            pdf: 'PDF',
            docx: 'Word Document',
            json: 'JSON Data'
        };
        alert(`Exporting as ${formatNames[format]}...`);
        // In production, call the actual export service:
        // await resumeService.exportResume(resumeData, format);
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

    // Track completed steps dynamically
    const completedSteps = React.useMemo(() => {
        const completed: number[] = [];

        // Step 0: Personal Info - check if name and email are filled
        if (resumeData.personal?.name && resumeData.personal?.email) {
            completed.push(0);
        }

        // Step 1: Experience - check if at least one experience entry exists
        if (resumeData.experience && resumeData.experience.length > 0) {
            completed.push(1);
        }

        // Step 2: Education - check if at least one education entry exists
        if (resumeData.education && resumeData.education.length > 0) {
            completed.push(2);
        }

        // Step 3: Skills - check if at least one skill exists
        if (resumeData.skills && resumeData.skills.length > 0) {
            completed.push(3);
        }

        // Step 4: Summary - check if summary is filled
        if (resumeData.personal?.summary && resumeData.personal.summary.length > 20) {
            completed.push(4);
        }

        return completed;
    }, [resumeData]);

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
                resumeName={resumeData.personal?.name || 'My Resume'}
            />

            <main className="flex-1 flex overflow-hidden relative ml-64">
                {/* Left Sidebar: Navigation - now fixed */}
                <ProgressStepper
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                    completedSteps={completedSteps}
                    onTemplateClick={() => alert('Browse templates modal coming soon...')}
                    onAIClick={() => alert('AI Assistant feature coming soon...')}
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
                    data={previewData}
                    templateId={selectedTemplate}
                    theme={currentTheme}
                />

                {/* AI Suggestions Overlay */}
                <AISuggestions />
            </main>
        </div>
    );
}
