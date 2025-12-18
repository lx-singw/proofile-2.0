"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import experienceService from "@/services/experienceService";

export const EXPERIENCES_QUERY_KEY = ["experiences"] as const;

export function useExperiences() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: EXPERIENCES_QUERY_KEY,
        queryFn: experienceService.getExperiences,
    });

    const invalidateExperiences = async () => {
        await queryClient.invalidateQueries({ queryKey: EXPERIENCES_QUERY_KEY });
    };

    return {
        ...query,
        experiences: query.data || [],
        invalidateExperiences
    };
}
