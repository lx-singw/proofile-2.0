'use client';

/**
 * Request Rating Page - Multi-step wizard for requesting ratings
 * 
 * Flow:
 * 1. Enter colleague's email
 * 2. Select relationship type
 * 3. Add context (company, role, period)
 * 4. Preview and send
 */

import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Mail, Users, Building, Send,
    CheckCircle, Loader2, Link as LinkIcon, MessageSquare, Copy
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RatingRequestForm {
    email: string;
    name: string;
    relationship: string;
    company: string;
    role: string;
    message: string;
}

const RELATIONSHIPS = [
    { value: 'manager', label: 'My Manager', description: 'They managed or supervised me' },
    { value: 'peer', label: 'Peer / Colleague', description: 'We worked together as equals' },
    { value: 'report', label: 'Direct Report', description: 'I managed or supervised them' },
    { value: 'client', label: 'Client', description: 'External client or stakeholder' },
    { value: 'mentor', label: 'Mentor', description: 'They mentored me professionally' },
];

export default function RequestRatingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const [form, setForm] = useState<RatingRequestForm>({
        email: '',
        name: '',
        relationship: '',
        company: '',
        role: '',
        message: '',
    });

    const updateForm = (field: keyof RatingRequestForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/ratings/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_email: form.email,
                    recipient_name: form.name,
                    relationship: form.relationship,
                    company: form.company,
                    role_at_company: form.role,
                    personal_message: form.message,
                }),
            });

            if (!response.ok) throw new Error('Failed to create request');

            const data = await response.json();
            setShareUrl(data.share_url);
            setSuccess(true);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Step 1: Email
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Who should rate you?
                </h2>
                <p className="text-gray-500 mt-2">
                    We'll send them an email invitation
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Their Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => updateForm('email', e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Their Name (optional)
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );

    // Step 2: Relationship
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    What's your relationship?
                </h2>
                <p className="text-gray-500 mt-2">
                    This helps weight the rating appropriately
                </p>
            </div>

            <div className="space-y-3">
                {RELATIONSHIPS.map((rel) => (
                    <button
                        key={rel.value}
                        onClick={() => updateForm('relationship', rel.value)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${form.relationship === rel.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {rel.label}
                                </p>
                                <p className="text-sm text-gray-500">{rel.description}</p>
                            </div>
                            {form.relationship === rel.value && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // Step 3: Context
    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Add context
                </h2>
                <p className="text-gray-500 mt-2">
                    Where did you work together?
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company
                    </label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => updateForm('company', e.target.value)}
                            placeholder="TechCorp Inc"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Their Role (optional)
                    </label>
                    <input
                        type="text"
                        value={form.role}
                        onChange={(e) => updateForm('role', e.target.value)}
                        placeholder="Senior Product Manager"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Personal Message (optional)
                    </label>
                    <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <textarea
                            value={form.message}
                            onChange={(e) => updateForm('message', e.target.value)}
                            placeholder="Hi! I'd appreciate your feedback on our time working together..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // Success state
    if (success) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Request Sent!
                </h2>
                <p className="text-gray-500 mb-6">
                    We've emailed {form.email} with your rating request.
                </p>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-2">Or share this link directly:</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm"
                        />
                        <button
                            onClick={copyLink}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/reputation')}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${s === step
                                ? 'bg-blue-600 text-white scale-110'
                                : s < step
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}
                    >
                        {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                    <ChevronLeft className="h-5 w-5" />
                    {step === 1 ? 'Cancel' : 'Back'}
                </button>

                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !form.email || step === 2 && !form.relationship}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
                    >
                        Next
                        <ChevronRight className="h-5 w-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !form.company}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Send Request
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
