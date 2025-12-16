import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JobRecommendation } from '@/services/jobService';

interface JobState {
    // Data
    recommendations: JobRecommendation[];
    savedJobs: number[]; // Job IDs
    appliedJobs: number[];

    // Filters
    minMatchScore: number;
    salaryRange: [number, number];
    verifiedOnly: boolean;
    searchQuery: string;

    // Actions
    setRecommendations: (jobs: JobRecommendation[]) => void;
    saveJob: (jobId: number) => void;
    unsaveJob: (jobId: number) => void;
    markApplied: (jobId: number) => void;
    setMinMatchScore: (score: number) => void;
    setSalaryRange: (range: [number, number]) => void;
    setVerifiedOnly: (enabled: boolean) => void;
    setSearchQuery: (query: string) => void;
    reset: () => void;
}

const initialState = {
    recommendations: [],
    savedJobs: [],
    appliedJobs: [],
    minMatchScore: 50,
    salaryRange: [50000, 300000] as [number, number],
    verifiedOnly: false,
    searchQuery: ''
};

export const useJobStore = create<JobState>()(
    persist(
        (set) => ({
            ...initialState,

            setRecommendations: (jobs) => set({ recommendations: jobs }),

            saveJob: (jobId) => set((state) => ({
                savedJobs: [...state.savedJobs, jobId]
            })),

            unsaveJob: (jobId) => set((state) => ({
                savedJobs: state.savedJobs.filter(id => id !== jobId)
            })),

            markApplied: (jobId) => set((state) => ({
                appliedJobs: [...state.appliedJobs, jobId]
            })),

            setMinMatchScore: (score) => set({ minMatchScore: score }),

            setSalaryRange: (range) => set({ salaryRange: range }),

            setVerifiedOnly: (enabled) => set({ verifiedOnly: enabled }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            reset: () => set(initialState)
        }),
        {
            name: 'proofile-jobs',
            partialize: (state) => ({
                savedJobs: state.savedJobs,
                appliedJobs: state.appliedJobs,
                minMatchScore: state.minMatchScore,
                salaryRange: state.salaryRange,
                verifiedOnly: state.verifiedOnly
            })
        }
    )
);
