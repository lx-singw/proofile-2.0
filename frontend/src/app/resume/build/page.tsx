'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Download, Sparkles } from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import TemplateSelector from '@/components/resume/TemplateSelector';
import LivePreview from '@/components/resume/LivePreview';
import PersonalInfoForm from '@/components/resume/steps/PersonalInfoForm';
import ExperienceForm from '@/components/resume/steps/ExperienceForm';
import EducationForm from '@/components/resume/steps/EducationForm';
import SkillsForm from '@/components/resume/steps/SkillsForm';
import { ResumeData } from '@/components/resume/templates';
import { resumeService } from '@/services/resumeService';

const STEPS = [
    { id: 'template', title: 'Choose Template' },
    { id: 'personal', title: 'Personal Info' },
    { id: 'experience', title: 'Experience' },
    { id: 'education', title: 'Education' },
    { id: 'skills', title: 'Skills' },
];

export default function ResumeBuilderPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
    const [resumeData, setResumeData] = useState<ResumeData>({
        personal: {},
        experience: [],
        education: [],
        skills: [],
    });

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSave = async () => {
        try {
            const resumeName = resumeData.personal?.name || 'My Resume';

            if (currentResumeId) {
                // Update existing resume
                await resumeService.update(currentResumeId, {
                    name: resumeName,
                    template_id: selectedTemplate,
                    data: resumeData,
                });
                alert('Resume saved successfully!');
            } else {
                // Create new resume
                const newResume = await resumeService.create(resumeName, selectedTemplate, resumeData);
                setCurrentResumeId(newResume.id);
                alert('Resume created successfully!');
            }
        } catch (error) {
            console.error('Error saving resume:', error);
            alert('Failed to save resume. Please try again.');
        }
    };

    const handleExport = async () => {
        if (!currentResumeId) {
            alert('Please save your resume first before exporting.');
            return;
        }

        try {
            const pdfBlob = await resumeService.exportPDF(currentResumeId);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${resumeData.personal?.name || 'resume'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const renderStepContent = () => {
        switch (STEPS[currentStep].id) {
            case 'template':
                return (
                    <TemplateSelector
                        selectedTemplateId={selectedTemplate}
                        onSelectTemplate={setSelectedTemplate}
                    />
                );
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
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Dashboard Header */}
            <DashboardHeader />

            {/* Page Header with Actions */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                                <Sparkles className="w-7 h-7 text-purple-600" />
                                Resume Builder
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Create your professional resume in minutes</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                <span className="font-medium">Save</span>
                            </button>
                            <button
                                onClick={handleExport}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                <span className="font-medium">Export PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${index === currentStep
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-110'
                                                : index < currentStep
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {index < currentStep ? '✓' : index + 1}
                                    </div>
                                    <span
                                        className={`mt-2 text-xs font-medium ${index === currentStep
                                                ? 'text-purple-600'
                                                : index < currentStep
                                                    ? 'text-green-600'
                                                    : 'text-gray-500'
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-16 h-1 mx-3 rounded-full transition-all ${index < currentStep ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content - Split Screen */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel - Form */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                                    Step {currentStep + 1} of {STEPS.length}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{STEPS[currentStep].title}</h2>
                        </div>

                        {renderStepContent()}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white font-medium"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={currentStep === STEPS.length - 1}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600 font-medium"
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Live Preview */}
                    <div className="sticky top-32 h-fit">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 shadow-xl border border-purple-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-700">Live Preview</span>
                                <span className="px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                                    {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template
                                </span>
                            </div>
                            <LivePreview templateId={selectedTemplate} data={resumeData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
