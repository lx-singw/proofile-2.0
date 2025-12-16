'use client';

import { DollarSign, Calendar, Briefcase, GraduationCap, BookOpen, Users, TrendingUp, Target, Award, Clock } from 'lucide-react';
import Link from 'next/link';

type OpportunityPreference = 'jobs' | 'training_skills_programs' | 'both' | null;

interface CategoryWidgetsProps {
    opportunityPreference: OpportunityPreference;
}

interface WidgetProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    href: string;
    gradient: string;
}

function Widget({ title, value, subtitle, icon, href, gradient }: WidgetProps) {
    return (
        <Link
            href={href}
            className={`${gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] block`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="opacity-80">{icon}</div>
                <span className="text-3xl font-bold">{value}</span>
            </div>
            <div className="font-medium">{title}</div>
            <div className="text-sm opacity-75">{subtitle}</div>
        </Link>
    );
}

// Jobs-specific widgets
function JobsWidgets() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Widget
                title="Active Applications"
                value={3}
                subtitle="2 in review"
                icon={<Briefcase className="w-8 h-8" />}
                href="/opportunities/saved"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <Widget
                title="Interview Schedule"
                value={2}
                subtitle="This week"
                icon={<Calendar className="w-8 h-8" />}
                href="/calendar"
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <Widget
                title="Salary Benchmark"
                value="R85k"
                subtitle="Market average"
                icon={<DollarSign className="w-8 h-8" />}
                href="/analytics/salary"
                gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <Widget
                title="Network Activity"
                value={12}
                subtitle="Profile views"
                icon={<TrendingUp className="w-8 h-8" />}
                href="/analytics"
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
        </div>
    );
}

// Training-specific widgets  
function TrainingWidgets() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Widget
                title="Program Applications"
                value={4}
                subtitle="1 shortlisted"
                icon={<GraduationCap className="w-8 h-8" />}
                href="/opportunities/saved"
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <Widget
                title="Course Progress"
                value="68%"
                subtitle="3 modules left"
                icon={<BookOpen className="w-8 h-8" />}
                href="/learning/progress"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <Widget
                title="Certificate Timeline"
                value={2}
                subtitle="Coming soon"
                icon={<Award className="w-8 h-8" />}
                href="/certifications"
                gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
            <Widget
                title="Mentor Connections"
                value={3}
                subtitle="Active mentors"
                icon={<Users className="w-8 h-8" />}
                href="/mentors"
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
        </div>
    );
}

// Both/All widgets
function BothWidgets() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Widget
                title="Total Applications"
                value={7}
                subtitle="Jobs & Training"
                icon={<Target className="w-8 h-8" />}
                href="/opportunities/saved"
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <Widget
                title="Skills Progress"
                value="72%"
                subtitle="Profile strength"
                icon={<TrendingUp className="w-8 h-8" />}
                href="/profile"
                gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            <Widget
                title="Upcoming"
                value={4}
                subtitle="Events & interviews"
                icon={<Clock className="w-8 h-8" />}
                href="/calendar"
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <Widget
                title="Connections"
                value={15}
                subtitle="Mentors & network"
                icon={<Users className="w-8 h-8" />}
                href="/network"
                gradient="bg-gradient-to-br from-pink-500 to-pink-600"
            />
        </div>
    );
}

export default function CategoryWidgets({ opportunityPreference }: CategoryWidgetsProps) {
    const getCategoryLabel = () => {
        switch (opportunityPreference) {
            case 'jobs':
                return 'Career Dashboard';
            case 'training_skills_programs':
                return 'Learning Dashboard';
            default:
                return 'Your Dashboard';
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {opportunityPreference === 'jobs' && <Briefcase className="w-5 h-5 text-blue-600" />}
                {opportunityPreference === 'training_skills_programs' && <GraduationCap className="w-5 h-5 text-emerald-600" />}
                {(opportunityPreference === 'both' || !opportunityPreference) && <Target className="w-5 h-5 text-indigo-600" />}
                {getCategoryLabel()}
            </h2>
            
            {opportunityPreference === 'jobs' && <JobsWidgets />}
            {opportunityPreference === 'training_skills_programs' && <TrainingWidgets />}
            {(opportunityPreference === 'both' || !opportunityPreference) && <BothWidgets />}
        </div>
    );
}
