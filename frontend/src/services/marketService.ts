import api from '@/lib/api';

export interface MarketSalaryData {
    role: string;
    location: string;
    range: {
        min: number;
        max: number;
        median: number;
        percentile25: number;
        percentile75: number;
    };
    sampleSize: number;
    lastUpdated: string;
}

export interface SkillDemand {
    skill: string;
    demandScore: number; // 0-100
    changePercent: number;
    openings: number;
}

const marketService = {
    /**
     * Get salary data for a role and location
     */
    async getSalaryData(role: string, location: string): Promise<MarketSalaryData> {
        // Mock data for now
        return {
            role,
            location,
            range: {
                min: 120000,
                max: 250000,
                median: 175000,
                percentile25: 145000,
                percentile75: 210000
            },
            sampleSize: 1250,
            lastUpdated: new Date().toISOString()
        };
    },

    /**
     * Get skill demand trends
     */
    async getSkillDemand(skills: string[]): Promise<SkillDemand[]> {
        // Mock trending skills data
        return [
            { skill: 'AI/ML', demandScore: 92, changePercent: 15, openings: 5420 },
            { skill: 'Product Strategy', demandScore: 88, changePercent: 8, openings: 3210 },
            { skill: 'B2B SaaS', demandScore: 85, changePercent: 5, openings: 2890 },
            { skill: 'Data Analytics', demandScore: 78, changePercent: 12, openings: 4100 },
            { skill: 'Agile/Scrum', demandScore: 72, changePercent: -3, openings: 6200 },
        ];
    },

    /**
     * Get market overview for user's target roles
     */
    async getMarketOverview(): Promise<{
        totalOpenings: number;
        averageSalary: number;
        topSkills: string[];
        hotLocations: string[];
    }> {
        return {
            totalOpenings: 15420,
            averageSalary: 185000,
            topSkills: ['AI/ML', 'Product Strategy', 'B2B SaaS'],
            hotLocations: ['San Francisco', 'New York', 'Remote']
        };
    }
};

export default marketService;
