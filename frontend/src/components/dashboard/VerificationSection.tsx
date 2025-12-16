'use client';

/**
 * VerificationSection - Dashboard component for trust verification
 * Displays TrustScoreRing + action items for verification
 */

import React, { useState, useEffect } from 'react';
import TrustScoreRing from '@/components/verification/dashboard/TrustScoreRing';
import { Shield, CheckCircle2, AlertCircle, ArrowRight, Building2, Fingerprint, Brain } from 'lucide-react';
import WorkEmailModal from '@/components/verification/modals/WorkEmailModal';

interface VerificationItem {
    type: 'identity' | 'employment' | 'skill';
    status: 'pending' | 'verified' | 'action_required';
    title: string;
    subtitle?: string;
    points: number;
}

interface VerificationSectionProps {
    userId?: string;
}

export default function VerificationSection({ userId }: VerificationSectionProps) {
    const [trustScore, setTrustScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [verifications, setVerifications] = useState<VerificationItem[]>([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | undefined>();

    useEffect(() => {
        fetchVerificationStatus();
    }, []);

    const fetchVerificationStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/verifications/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTrustScore(data.trust_score || 0);

                // Build verification items from response
                const items: VerificationItem[] = [];

                if (data.identity_verified) {
                    items.push({
                        type: 'identity',
                        status: 'verified',
                        title: 'Identity Verified',
                        subtitle: 'Government ID confirmed',
                        points: 30
                    });
                } else {
                    items.push({
                        type: 'identity',
                        status: 'action_required',
                        title: 'Verify Your Identity',
                        subtitle: 'Scan your government ID for L3 trust',
                        points: 30
                    });
                }

                if ((data.verified_jobs_count || 0) > 0) {
                    items.push({
                        type: 'employment',
                        status: 'verified',
                        title: `${data.verified_jobs_count} Jobs Verified`,
                        subtitle: 'Employment history confirmed',
                        points: 15
                    });
                } else {
                    items.push({
                        type: 'employment',
                        status: 'action_required',
                        title: 'Verify Employment',
                        subtitle: 'Use your work email to verify jobs',
                        points: 15
                    });
                }

                setVerifications(items);
            }
        } catch (error) {
            console.error('Failed to fetch verification status:', error);
            // Set default action items
            setVerifications([
                {
                    type: 'identity',
                    status: 'action_required',
                    title: 'Verify Your Identity',
                    subtitle: 'Scan your government ID',
                    points: 30
                },
                {
                    type: 'employment',
                    status: 'action_required',
                    title: 'Verify Employment',
                    subtitle: 'Confirm your work history',
                    points: 15
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = (type: string) => {
        if (type === 'employment') {
            setShowEmailModal(true);
        } else if (type === 'identity') {
            window.location.href = '/verification/identity';
        }
    };

    const handleVerificationSuccess = () => {
        setShowEmailModal(false);
        fetchVerificationStatus();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'identity': return <Fingerprint className="h-5 w-5" />;
            case 'employment': return <Building2 className="h-5 w-5" />;
            case 'skill': return <Brain className="h-5 w-5" />;
            default: return <Shield className="h-5 w-5" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'pending': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
            default: return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Trust Score
                        </h3>
                    </div>
                    <a
                        href="/verification"
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                        View All <ArrowRight className="h-4 w-4" />
                    </a>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Trust Score Ring */}
                    <div className="flex-shrink-0">
                        <TrustScoreRing score={trustScore} size={100} />
                    </div>

                    {/* Verification Items */}
                    <div className="flex-1 space-y-3 w-full">
                        {verifications.map((item, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${item.status === 'verified'
                                        ? 'bg-green-50 dark:bg-green-900/20'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                                        {item.status === 'verified' ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            getIcon(item.type)
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {item.subtitle} • +{item.points} pts
                                        </p>
                                    </div>
                                </div>

                                {item.status !== 'verified' && (
                                    <button
                                        onClick={() => handleVerifyClick(item.type)}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                        Verify
                                    </button>
                                )}
                            </div>
                        ))}

                        {trustScore < 50 && (
                            <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>Complete verifications to unlock premium job opportunities</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <WorkEmailModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                companyName={selectedCompany}
                onSuccess={handleVerificationSuccess}
            />
        </>
    );
}
