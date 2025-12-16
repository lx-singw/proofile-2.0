// Profile Components
export { ProfileHeader } from "./profile/ProfileHeader";
export { ProfileTabs } from "./profile/ProfileTabs";
export { EditableField } from "./profile/EditableField";

// Feed Components
export { FeedCard } from "./feed/FeedCard";
export type { FeedItem, FeedItemType } from "./feed/FeedCard";

// Discovery Components
export { AdvancedSearch } from "./discover/AdvancedSearch";
export { ProfileCard } from "./discover/ProfileCard";
export type { ProfileCardData } from "./discover/ProfileCard";

// Social Components
export {
    EndorsementButton,
    SkillEndorsementSection,
    RatingStars,
    WriteReview
} from "./social/EndorsementsAndRatings";
export {
    ConnectionButton,
    ConnectionRequestCard,
    ConnectionRequestsList
} from "./social/ConnectionRequest";

// AI Components
export { AIProfileSuggestions, generateSampleSuggestions } from "./ai/AIProfileSuggestions";
export { AIJobMatches, generateSampleJobMatches } from "./ai/AIJobMatches";
export { AIChatAssistant } from "./ai/AIChatAssistant";

// Analytics Components
export {
    AnalyticsDashboard,
    generateSampleMetrics,
    generateSampleViewsData
} from "./analytics/AnalyticsDashboard";
export { CareerInsights, generateSampleInsights } from "./analytics/CareerInsights";
