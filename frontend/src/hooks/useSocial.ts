import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import socialService, {
    SkillWithEndorsements,
    RatingSummary,
    Rating,
    ConnectionRequest,
    ConnectionStatus
} from "@/services/socialService";
import { toast } from "@/lib/toast";

// Query Keys
export const socialKeys = {
    all: ["social"] as const,
    endorsements: (profileId: number) => [...socialKeys.all, "endorsements", profileId] as const,
    ratingSummary: (profileId: number) => [...socialKeys.all, "ratingSummary", profileId] as const,
    reviews: (profileId: number) => [...socialKeys.all, "reviews", profileId] as const,
    connectionStatus: (userId: number) => [...socialKeys.all, "connectionStatus", userId] as const,
    pendingRequests: () => [...socialKeys.all, "pendingRequests"] as const,
};

// Endorsements Hooks
export function useSkillEndorsements(profileId: number) {
    return useQuery({
        queryKey: socialKeys.endorsements(profileId),
        queryFn: () => socialService.getSkillEndorsements(profileId),
        enabled: !!profileId,
    });
}

export function useEndorseSkill(profileId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (skillName: string) => socialService.endorseSkill(profileId, skillName),
        onMutate: async (skillName) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: socialKeys.endorsements(profileId) });
            const previous = queryClient.getQueryData<SkillWithEndorsements[]>(socialKeys.endorsements(profileId));

            if (previous) {
                queryClient.setQueryData(
                    socialKeys.endorsements(profileId),
                    previous.map(skill =>
                        skill.name === skillName
                            ? { ...skill, endorsements: skill.endorsements + 1, isEndorsedByMe: true }
                            : skill
                    )
                );
            }
            return { previous };
        },
        onError: (err, skillName, context) => {
            if (context?.previous) {
                queryClient.setQueryData(socialKeys.endorsements(profileId), context.previous);
            }
            toast.error("Failed to endorse skill");
        },
        onSuccess: () => {
            toast.success("Skill endorsed!");
        },
    });
}

// Ratings Hooks
export function useRatingSummary(profileId: number) {
    return useQuery({
        queryKey: socialKeys.ratingSummary(profileId),
        queryFn: () => socialService.getRatingSummary(profileId),
        enabled: !!profileId,
    });
}

export function useReviews(profileId: number) {
    return useQuery({
        queryKey: socialKeys.reviews(profileId),
        queryFn: () => socialService.getReviews(profileId),
        enabled: !!profileId,
    });
}

export function useSubmitReview(profileId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
            socialService.submitReview(profileId, rating, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: socialKeys.ratingSummary(profileId) });
            queryClient.invalidateQueries({ queryKey: socialKeys.reviews(profileId) });
            toast.success("Review submitted!");
        },
        onError: () => {
            toast.error("Failed to submit review");
        },
    });
}

// Connection Hooks
export function useConnectionStatus(userId: number) {
    return useQuery({
        queryKey: socialKeys.connectionStatus(userId),
        queryFn: () => socialService.getConnectionStatus(userId),
        enabled: !!userId,
    });
}

export function useSendConnectionRequest(userId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (message?: string) => socialService.requestConnection(userId, message),
        onSuccess: () => {
            queryClient.setQueryData<ConnectionStatus>(socialKeys.connectionStatus(userId), "pending");
            toast.success("Connection request sent!");
        },
        onError: () => {
            toast.error("Failed to send connection request");
        },
    });
}

export function usePendingRequests() {
    return useQuery({
        queryKey: socialKeys.pendingRequests(),
        queryFn: socialService.getPendingRequests,
    });
}

export function useRespondToRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
            socialService.respondToConnectionRequest(requestId, accept),
        onSuccess: (_, { accept }) => {
            queryClient.invalidateQueries({ queryKey: socialKeys.pendingRequests() });
            toast.success(accept ? "Connection accepted!" : "Request declined");
        },
        onError: () => {
            toast.error("Failed to respond to request");
        },
    });
}
