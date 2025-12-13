"use client";

import React, { useState } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import {
    ProfileHeader
} from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { EditableField } from "@/components/profile/EditableField";
import { FeedCard, FeedItem } from "@/components/feed/FeedCard";
import { AdvancedSearch } from "@/components/discover/AdvancedSearch";
import { ProfileCard, ProfileCardData } from "@/components/discover/ProfileCard";
import {
    SkillEndorsementSection,
    RatingStars,
    WriteReview
} from "@/components/social/EndorsementsAndRatings";
import {
    ConnectionButton,
    ConnectionRequestsList
} from "@/components/social/ConnectionRequest";
import {
    AIProfileSuggestions,
    generateSampleSuggestions
} from "@/components/ai/AIProfileSuggestions";
import {
    AIJobMatches,
    generateSampleJobMatches
} from "@/components/ai/AIJobMatches";
import { AIChatAssistant } from "@/components/ai/AIChatAssistant";
import {
    AnalyticsDashboard,
    generateSampleMetrics,
    generateSampleViewsData
} from "@/components/analytics/AnalyticsDashboard";
import {
    CareerInsights,
    generateSampleInsights
} from "@/components/analytics/CareerInsights";
import { toast } from "@/lib/toast";
import { ChevronDown, ChevronUp, Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample data
const SAMPLE_USER = {
    id: 1,
    full_name: "Alex Developer",
    username: "alexdev",
    email: "alex@example.com",
};

const SAMPLE_PROFILE = {
    id: 1,
    headline: "Senior Full-Stack Engineer | React & Node.js",
    summary: "Building scalable web applications with modern technologies.",
    avatar_url: null,
    completeness_data: { trust: 85 },
    skills_data: ["React", "TypeScript", "Node.js", "Python"],
    experience_data: [
        { company: "TechCorp", title: "Senior Engineer", start_date: "2021", end_date: "Present" }
    ],
};

const SAMPLE_FEED_ITEM: FeedItem = {
    id: "1",
    type: "skill_verified",
    user: { id: 1, name: "Sarah Chen", headline: "PM at Google" },
    content: "Just got my React expertise verified! 🎉",
    likes: 42,
    comments: 8,
    created_at: new Date().toISOString(),
};

const SAMPLE_PROFILES: ProfileCardData[] = [
    { id: 1, name: "John Doe", headline: "Software Engineer", rating: 4.8, is_verified: true, skills: ["React", "Node.js"] },
];

const SAMPLE_SKILLS = [
    { name: "React", endorsements: 23, isEndorsedByMe: true },
    { name: "TypeScript", endorsements: 18, isEndorsedByMe: false },
    { name: "Node.js", endorsements: 15, isEndorsedByMe: false },
];

interface ComponentSectionProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

function ComponentSection({ title, description, children }: ComponentSectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="p-6 bg-white dark:bg-gray-900">
                    {children}
                </div>
            )}
        </div>
    );
}

export default function ShowcasePage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("none");

    const handleMockAction = (action: string) => {
        toast.success(`Action: ${action}`);
    };

    const mockAIResponse = async (message: string): Promise<string> => {
        await new Promise(r => setTimeout(r, 1000));
        return `This is a mock response to: "${message}". In production, this would connect to the AI backend.`;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <DashboardHeader />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        🎨 Component Showcase
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Interactive demonstration of all Proofile Transformer components.
                        Click on any section to expand/collapse.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Profile Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📱 Profile Components</h2>

                        <ComponentSection title="ProfileHeader" description="Glassmorphic header with trust badge and inline editing">
                            <ProfileHeader
                                user={SAMPLE_USER}
                                profile={SAMPLE_PROFILE}
                                isOwner={true}
                                isFollowing={false}
                                onFollow={() => handleMockAction("Follow")}
                                onShare={() => handleMockAction("Share")}
                                onDownloadResume={() => handleMockAction("Download Resume")}
                                onShowQR={() => handleMockAction("Show QR")}
                                onUpdate={async (data) => handleMockAction(`Update: ${JSON.stringify(data)}`)}
                            />
                        </ComponentSection>

                        <ComponentSection title="ProfileTabs" description="Tab navigation for profile sections">
                            <ProfileTabs
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                countMap={{ experience: 3, skills: 8 }}
                            />
                        </ComponentSection>

                        <ComponentSection title="EditableField" description="Inline text editing component">
                            <div className="max-w-md">
                                <p className="text-sm text-gray-500 mb-2">Click to edit:</p>
                                <EditableField
                                    value="Click me to edit this text"
                                    onSave={async (val) => handleMockAction(`Saved: ${val}`)}
                                    isOwner={true}
                                    className="text-lg font-medium"
                                />
                            </div>
                        </ComponentSection>
                    </div>

                    {/* Feed Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📰 Feed Components</h2>

                        <ComponentSection title="FeedCard" description="Social feed item with interactions">
                            <div className="max-w-xl">
                                <FeedCard
                                    item={SAMPLE_FEED_ITEM}
                                    onLike={() => handleMockAction("Like")}
                                    onComment={() => handleMockAction("Comment")}
                                    onShare={() => handleMockAction("Share")}
                                />
                            </div>
                        </ComponentSection>
                    </div>

                    {/* Discovery Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔍 Discovery Components</h2>

                        <ComponentSection title="AdvancedSearch" description="Search with filters">
                            <AdvancedSearch
                                onSearch={(filters) => handleMockAction(`Search: ${JSON.stringify(filters)}`)}
                            />
                        </ComponentSection>

                        <ComponentSection title="ProfileCard" description="Compact profile display">
                            <div className="max-w-md">
                                <ProfileCard
                                    profile={SAMPLE_PROFILES[0]}
                                    onConnect={() => handleMockAction("Connect")}
                                    showMatchScore
                                />
                            </div>
                        </ComponentSection>
                    </div>

                    {/* Social Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🤝 Social Components</h2>

                        <ComponentSection title="SkillEndorsementSection" description="Endorsable skill badges">
                            <SkillEndorsementSection
                                skills={SAMPLE_SKILLS}
                                onEndorse={(skill) => handleMockAction(`Endorse: ${skill}`)}
                                isOwner={false}
                            />
                        </ComponentSection>

                        <ComponentSection title="RatingStars & WriteReview" description="Rating and review system">
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Interactive Rating:</p>
                                    <RatingStars value={4} onChange={(v) => handleMockAction(`Rating: ${v}`)} size="lg" />
                                </div>
                                <WriteReview onSubmit={(r, c) => handleMockAction(`Review: ${r} stars - ${c}`)} />
                            </div>
                        </ComponentSection>

                        <ComponentSection title="ConnectionButton" description="Connection state management">
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">None</p>
                                    <ConnectionButton status="none" onConnect={() => setConnectionStatus("pending")} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Pending</p>
                                    <ConnectionButton status="pending" onConnect={() => { }} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-2">Connected</p>
                                    <ConnectionButton status="connected" onConnect={() => { }} onMessage={() => handleMockAction("Message")} />
                                </div>
                            </div>
                        </ComponentSection>
                    </div>

                    {/* AI Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🤖 AI Components</h2>

                        <ComponentSection title="AIProfileSuggestions" description="Smart profile enhancement">
                            <AIProfileSuggestions
                                suggestions={generateSampleSuggestions()}
                                onApply={(s) => handleMockAction(`Apply: ${s.type}`)}
                                onRefresh={() => handleMockAction("Refresh suggestions")}
                            />
                        </ComponentSection>

                        <ComponentSection title="AIJobMatches" description="AI-powered job matching">
                            <AIJobMatches
                                matches={generateSampleJobMatches()}
                                onViewJob={(id) => handleMockAction(`View job: ${id}`)}
                                onApply={(id) => handleMockAction(`Apply to job: ${id}`)}
                            />
                        </ComponentSection>

                        <ComponentSection title="AIChatAssistant" description="Conversational career assistant">
                            <div className="max-w-2xl">
                                <AIChatAssistant onSendMessage={mockAIResponse} />
                            </div>
                        </ComponentSection>
                    </div>

                    {/* Analytics Components */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Analytics Components</h2>

                        <ComponentSection title="AnalyticsDashboard" description="Metrics and charts">
                            <AnalyticsDashboard
                                metrics={generateSampleMetrics()}
                                profileViews={generateSampleViewsData()}
                            />
                        </ComponentSection>

                        <ComponentSection title="CareerInsights" description="Personalized career recommendations">
                            <CareerInsights insights={generateSampleInsights()} />
                        </ComponentSection>
                    </div>
                </div>
            </main>
        </div>
    );
}
