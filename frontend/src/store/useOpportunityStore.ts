import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OpportunityRecommendation } from '@/services/opportunityService';

interface OpportunityState {
    // Data
    recommendations: OpportunityRecommendation[];
    savedOpportunities: number[]; // Opportunity IDs
    appliedOpportunities: number[];

    // Filters
    minMatchScore: number;
    salaryRange: [number, number];
    verifiedOnly: boolean;
    searchQuery: string;
    category: 'jobs' | 'training_skills_programs' | null; // NEW: category filter

    // Actions
    setRecommendations: (opportunities: OpportunityRecommendation[]) => void;
    saveOpportunity: (opportunityId: number) => void;
    unsaveOpportunity: (opportunityId: number) => void;
    markApplied: (opportunityId: number) => void;
    setMinMatchScore: (score: number) => void;
    setSalaryRange: (range: [number, number]) => void;
    setVerifiedOnly: (enabled: boolean) => void;
    setSearchQuery: (query: string) => void;
    setCategory: (category: 'jobs' | 'training_skills_programs' | null) => void;
    reset: () => void;
}

const initialState = {
    recommendations: [],
    savedOpportunities: [],
    appliedOpportunities: [],
    minMatchScore: 50,
    salaryRange: [50000, 300000] as [number, number],
    verifiedOnly: false,
    searchQuery: '',
    category: null as 'jobs' | 'training_skills_programs' | null
};

export const useOpportunityStore = create<OpportunityState>()(
    persist(
        (set) => ({
            ...initialState,

            setRecommendations: (opportunities) => set({ recommendations: opportunities }),

            saveOpportunity: (opportunityId) => set((state) => ({
                savedOpportunities: [...state.savedOpportunities, opportunityId]
            })),

            unsaveOpportunity: (opportunityId) => set((state) => ({
                savedOpportunities: state.savedOpportunities.filter(id => id !== opportunityId)
            })),

            markApplied: (opportunityId) => set((state) => ({
                appliedOpportunities: [...state.appliedOpportunities, opportunityId]
            })),

            setMinMatchScore: (score) => set({ minMatchScore: score }),

            setSalaryRange: (range) => set({ salaryRange: range }),

            setVerifiedOnly: (enabled) => set({ verifiedOnly: enabled }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            setCategory: (category) => set({ category }),

            reset: () => set(initialState)
        }),
        {
            name: 'proofile-opportunities',
            partialize: (state) => ({
                savedOpportunities: state.savedOpportunities,
                appliedOpportunities: state.appliedOpportunities,
                minMatchScore: state.minMatchScore,
                salaryRange: state.salaryRange,
                verifiedOnly: state.verifiedOnly,
                category: state.category
            })
        }
    )
);

// Backward compatibility alias
export const useJobStore = useOpportunityStore;

