import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import aiService, { AIProfileSuggestion, AIJobMatch, ChatMessage } from "@/services/aiService";
import { toast } from "@/lib/toast";

// Query Keys
export const aiKeys = {
    all: ["ai"] as const,
    suggestions: () => [...aiKeys.all, "suggestions"] as const,
    jobMatches: (limit?: number) => [...aiKeys.all, "jobMatches", limit] as const,
    chatHistory: (conversationId: string) => [...aiKeys.all, "chat", conversationId] as const,
};

// Profile Suggestions Hook
export function useProfileSuggestions() {
    return useQuery({
        queryKey: aiKeys.suggestions(),
        queryFn: aiService.getProfileSuggestions,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useApplySuggestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (suggestionId: string) => aiService.applyProfileSuggestion(suggestionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: aiKeys.suggestions() });
            toast.success("Suggestion applied successfully!");
        },
        onError: () => {
            toast.error("Failed to apply suggestion");
        },
    });
}

// Job Matches Hook
export function useJobMatches(limit: number = 5) {
    return useQuery({
        queryKey: aiKeys.jobMatches(limit),
        queryFn: () => aiService.getJobMatches(limit),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

// Chat Hook with optimistic updates
export function useAIChat(conversationId?: string) {
    const queryClient = useQueryClient();

    const { data: history = [] } = useQuery({
        queryKey: conversationId ? aiKeys.chatHistory(conversationId) : ["empty"],
        queryFn: () => conversationId ? aiService.getChatHistory(conversationId) : Promise.resolve([]),
        enabled: !!conversationId,
    });

    const sendMessage = useMutation({
        mutationFn: async (message: string) => {
            return aiService.sendChatMessage(message, conversationId);
        },
        onMutate: async (message) => {
            // Optimistic update - add user message immediately
            if (conversationId) {
                const previousHistory = queryClient.getQueryData<ChatMessage[]>(aiKeys.chatHistory(conversationId));
                const optimisticMessage: ChatMessage = {
                    id: `temp-${Date.now()}`,
                    role: "user",
                    content: message,
                    timestamp: new Date().toISOString(),
                };
                queryClient.setQueryData(aiKeys.chatHistory(conversationId), [...(previousHistory || []), optimisticMessage]);
                return { previousHistory };
            }
        },
        onError: (err, message, context) => {
            // Rollback on error
            if (conversationId && context?.previousHistory) {
                queryClient.setQueryData(aiKeys.chatHistory(conversationId), context.previousHistory);
            }
            toast.error("Failed to send message");
        },
        onSuccess: (data) => {
            if (data.conversationId) {
                queryClient.invalidateQueries({ queryKey: aiKeys.chatHistory(data.conversationId) });
            }
        },
    });

    return {
        history,
        sendMessage: sendMessage.mutate,
        isLoading: sendMessage.isPending,
    };
}
