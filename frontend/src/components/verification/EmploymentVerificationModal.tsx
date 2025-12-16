"use client";

import React, { useState } from "react";
import {
    X,
    Briefcase,
    Mail,
    Calendar,
    Building2,
    User,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { toast } from "@/lib/toast";
import verificationService from "@/services/verificationService";

interface EmploymentVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EmploymentVerificationModal({
    isOpen,
    onClose,
    onSuccess
}: EmploymentVerificationModalProps) {
    const [step, setStep] = useState<"form" | "sent" | "error">("form");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        role: "",
        department: "",
        managerEmail: "",
        managerName: "",
        startDate: "",
        endDate: "",
        isCurrent: true
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate manager email is a company email (basic check)
        if (formData.managerEmail.includes("gmail.com") ||
            formData.managerEmail.includes("yahoo.com") ||
            formData.managerEmail.includes("hotmail.com")) {
            toast.error("Please use your manager's company email address");
            return;
        }

        setLoading(true);
        try {
            await verificationService.createVerification({
                verification_type: "employment",
                verification_data: JSON.stringify({
                    company_name: formData.companyName,
                    role: formData.role,
                    department: formData.department,
                    manager_email: formData.managerEmail,
                    manager_name: formData.managerName,
                    start_date: formData.startDate,
                    end_date: formData.isCurrent ? null : formData.endDate,
                    is_current: formData.isCurrent
                })
            });
            setStep("sent");
            toast.success("Verification request sent!");
        } catch (error) {
            console.error("Failed to send verification request:", error);
            setStep("error");
            toast.error("Failed to send verification request");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep("form");
        setFormData({
            companyName: "",
            role: "",
            department: "",
            managerEmail: "",
            managerName: "",
            startDate: "",
            endDate: "",
            isCurrent: true
        });
        onClose();
        if (step === "sent") {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Verify Employment
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Get your work verified by your manager
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {step === "form" && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Company Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Company Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                    placeholder="e.g., TechCorp Inc."
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Your Role *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                        placeholder="e.g., Senior Engineer"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                        placeholder="e.g., Engineering"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Employment Dates */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Employment Dates
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="month"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="month"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        disabled={formData.isCurrent}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isCurrent}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    I currently work here
                                </span>
                            </label>
                        </div>

                        {/* Manager Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Manager/HR Contact
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Manager's Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.managerName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                                    placeholder="e.g., Sarah Johnson"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Manager's Company Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.managerEmail}
                                        onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                                        placeholder="manager@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Must be a company email (not gmail, yahoo, etc.)
                                </p>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                📧 We'll send a verification email to your manager. They can confirm or decline
                                with one click. Your email will not be shared publicly.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Verification Request
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === "sent" && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Verification Request Sent!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We've sent an email to <strong>{formData.managerEmail}</strong>.
                            They can verify your employment with one click.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            You'll receive a notification when they respond.
                            This usually takes 1-3 business days.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}

                {step === "error" && (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Something Went Wrong
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We couldn't send the verification request. Please try again.
                        </p>
                        <button
                            onClick={() => setStep("form")}
                            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
