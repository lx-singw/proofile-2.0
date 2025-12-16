import React from 'react';
import { Shield, Award, CheckCircle, Clock, Lock, Briefcase, GraduationCap } from 'lucide-react';
import { Verification } from '@/services/verificationService';

interface AssetWalletProps {
    verifications: Verification[];
    onVerifyClick: (type: string) => void;
}

const LevelBadge = ({ level }: { level?: string }) => {
    switch (level) {
        case 'L3': // Identity (Gold)
            return <div className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">GOLD</div>;
        case 'L2': // History (Silver)
            return <div className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">SILVER</div>;
        case 'L1': // Skills (Bronze)
            return <div className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-200">BRONZE</div>;
        default:
            return null;
    }
};

const AssetCard = ({
    type,
    value,
    status,
    level,
    levelLabel,
    icon: Icon,
    onClick
}: {
    type: string;
    value: string;
    status: string;
    level: string;
    levelLabel: string;
    icon: any;
    onClick: () => void;
}) => {
    const isVerified = status === 'verified';

    return (
        <div
            onClick={onClick}
            className={`
                relative group cursor-pointer overflow-hidden rounded-xl border transition-all duration-300
                ${isVerified
                    ? 'bg-white border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300'
                    : 'bg-slate-50 border-dashed border-slate-300 hover:bg-slate-100'}
            `}
        >
            {/* Holographic Effect for Verified Cards */}
            {isVerified && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isVerified ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        <Icon size={24} />
                    </div>
                    {isVerified ? (
                        <CheckCircle className="text-green-500" size={20} />
                    ) : (
                        <div className="flex items-center text-xs text-slate-500">
                            <Clock size={14} className="mr-1" /> Pending
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{type}</h3>
                    <p className={`font-bold ${isVerified ? 'text-slate-900 text-lg' : 'text-slate-400'}`}>
                        {value}
                    </p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <div className="flex items-center space-x-2">
                        <LevelBadge level={level} />
                        <span className="text-xs text-slate-400">{levelLabel}</span>
                    </div>
                    {isVerified && (
                        <Shield className="text-blue-200 group-hover:text-blue-400 transition-colors" size={16} />
                    )}
                </div>
            </div>

            {/* Action Overlay */}
            {!isVerified && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-lg text-sm font-medium text-blue-600">
                        Verify Now
                    </span>
                </div>
            )}
        </div>
    );
};

export default function AssetWallet({ verifications, onVerifyClick }: AssetWalletProps) {
    const getVerification = (type: string) => verifications.find(v => v.verification_type === type);

    const identity = getVerification('identity');
    const email = getVerification('email');
    const skills = getVerification('skills'); // Example

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                    <Shield className="mr-2 text-blue-600" />
                    Your Trust Assets
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View Blockchain Record
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* L3: Identity Card */}
                <AssetCard
                    type="Identity"
                    value={identity?.verified_value || "Identity Unverified"}
                    status={identity?.status || "not_started"}
                    level="L3"
                    levelLabel="Legal Identity"
                    icon={Shield}
                    onClick={() => onVerifyClick('identity')}
                />

                {/* L2: Work Identity */}
                <AssetCard
                    type="Professional"
                    value={email?.verified_value || "Work Email Unverified"}
                    status={email?.status || "not_started"}
                    level="L2"
                    levelLabel="Employment"
                    icon={Briefcase}
                    onClick={() => onVerifyClick('email')}
                />

                {/* L1: Skills (Placeholder for now) */}
                <AssetCard
                    type="Skill"
                    value={skills?.verified_value || "Add a Skill"}
                    status={skills?.status || "not_started"}
                    level="L1"
                    levelLabel="Competency"
                    icon={Award}
                    onClick={() => onVerifyClick('skills')}
                />

                {/* Pending Actions / Empty State */}
                <div
                    onClick={() => onVerifyClick('new')}
                    className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 min-h-[200px]"
                >
                    <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                        <Lock size={24} />
                    </div>
                    <span className="font-medium">Unlock New Asset</span>
                    <span className="text-xs mt-1">Add Education or Projects</span>
                </div>
            </div>
        </div>
    );
}
