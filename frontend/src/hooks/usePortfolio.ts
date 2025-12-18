"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import portfolioService from "@/services/portfolioService";

export const PORTFOLIO_QUERY_KEY = ["portfolio"] as const;

export function usePortfolio() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: PORTFOLIO_QUERY_KEY,
        queryFn: portfolioService.getPortfolio,
    });

    const invalidatePortfolio = async () => {
        await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
    };

    return {
        ...query,
        portfolio: query.data || [],
        invalidatePortfolio
    };
}
