import { apiRequest } from '@/lib/api';

export interface Guild {
    id: number;
    name: str;
    slug: string;
    description: string;
    icon_url?: string;
    min_trust_score: number;
    member_count: number;
    is_member: boolean;
}

export interface GuildContent {
    status: string;
    content: string;
    exclusive_data: any;
}

export const ecosystemService = {
    /**
     * Fetch all available guilds
     */
    async getGuilds(): Promise<Guild[]> {
        return apiRequest({
            method: 'GET',
            url: '/api/v1/guilds/'
        });
    },

    /**
     * Join a guild
     */
    async joinGuild(slug: string): Promise<any> {
        return apiRequest({
            method: 'POST',
            url: `/api/v1/guilds/${slug}/join`
        });
    },

    /**
     * Leave a guild
     */
    async leaveGuild(slug: string): Promise<any> {
        return apiRequest({
            method: 'DELETE',
            url: `/api/v1/guilds/${slug}/leave`
        });
    },

    /**
     * Fetch trust-gated content for a guild
     */
    async getGuildContent(slug: string): Promise<GuildContent> {
        return apiRequest({
            method: 'GET',
            url: `/api/v1/guilds/${slug}/content`
        });
    }
};

export default ecosystemService;
