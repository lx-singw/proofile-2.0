/**
 * AI Chat service: Career coaching, profile analysis, AI-powered assistance
 */
import { apiRequest } from "@/lib/api";

// ============ Types ============
export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string | null;
  session_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface ChatResponse {
  session_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface ProfileInsight {
  category: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action_url: string | null;
}

export interface ProfileAnalysis {
  completeness_score: number;
  strengths: string[];
  improvements: ProfileInsight[];
  career_opportunities: string[];
  skill_gaps: string[];
}

// ============ Chat Functions ============
export async function getChatSessions(): Promise<ChatSession[]> {
  return apiRequest<ChatSession[]>({
    url: "/api/v1/ai-chat/sessions",
    method: "GET",
  });
}

export async function getChatSession(
  sessionId: number
): Promise<ChatSessionWithMessages> {
  return apiRequest<ChatSessionWithMessages>({
    url: `/api/v1/ai-chat/sessions/${sessionId}`,
    method: "GET",
  });
}

export async function sendChatMessage(
  message: string,
  sessionId?: number,
  sessionType: string = "career_coach"
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>({
    url: "/api/v1/ai-chat/chat",
    method: "POST",
    data: {
      message,
      session_id: sessionId,
      session_type: sessionType,
    },
  });
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/ai-chat/sessions/${sessionId}`,
    method: "DELETE",
  });
}

// ============ Profile Analysis Functions ============
export async function getProfileAnalysis(): Promise<ProfileAnalysis> {
  return apiRequest<ProfileAnalysis>({
    url: "/api/v1/ai-chat/profile-analysis",
    method: "GET",
  });
}

// Export as default object for convenience
export const aiChatService = {
  getChatSessions,
  getChatSession,
  sendChatMessage,
  deleteChatSession,
  getProfileAnalysis,
};
