import { api, apiRequest } from "@/lib/api";

// Types
export interface Endorsement {
  id: string;
  skillName: string;
  endorserId: number;
  endorserName: string;
  endorserAvatar?: string;
  createdAt: string;
}

export interface SkillWithEndorsements {
  name: string;
  endorsements: number;
  isEndorsedByMe: boolean;
  topEndorsers?: { name: string; avatar?: string }[];
}

export interface Rating {
  id: string;
  rating: number;
  comment?: string;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  total: number;
  distribution: { stars: number; count: number }[];
}

export interface ConnectionRequest {
  id: string;
  userId: number;
  name: string;
  headline?: string;
  avatarUrl?: string;
  message?: string;
  createdAt: string;
}

export type ConnectionStatus = "none" | "pending" | "connected" | "received";

const SOCIAL_BASE_PATH = "/api/v1/social";

// Follows
export async function followUser(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/follow`,
      data: { following_id: userId },
    });
    return true;
  } catch (error) {
    console.error("Failed to follow user:", error);
    return false;
  }
}

export async function unfollowUser(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "delete",
      url: `${SOCIAL_BASE_PATH}/follow/${userId}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to unfollow user:", error);
    return false;
  }
}

export async function getFollowers(): Promise<any[]> {
  try {
    return await apiRequest<any[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/followers`,
    });
  } catch (error) {
    console.error("Failed to fetch followers:", error);
    return [];
  }
}

export async function getFollowing(): Promise<any[]> {
  try {
    return await apiRequest<any[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/following`,
    });
  } catch (error) {
    console.error("Failed to fetch following:", error);
    return [];
  }
}

// Endorsements
export async function getSkillEndorsements(profileId: number): Promise<SkillWithEndorsements[]> {
  try {
    return await apiRequest<SkillWithEndorsements[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/endorsements/user/${profileId}`,
    });
  } catch (error) {
    console.error("Failed to fetch endorsements:", error);
    return [];
  }
}

export async function endorseSkill(profileId: number, skillName: string): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/endorsements`,
      data: { endorsed_user_id: profileId, skill: skillName },
    });
    return true;
  } catch (error) {
    console.error("Failed to endorse skill:", error);
    return false;
  }
}

export async function removeEndorsement(profileId: number, skillName: string): Promise<boolean> {
  try {
    await apiRequest({
      method: "delete",
      url: `${SOCIAL_BASE_PATH}/endorsements`,
      params: { endorsed_user_id: profileId, skill: skillName },
    });
    return true;
  } catch (error) {
    console.error("Failed to remove endorsement:", error);
    return false;
  }
}

// Star Profile
export async function starProfile(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/stars`,
      data: { starred_user_id: userId },
    });
    return true;
  } catch (error) {
    console.error("Failed to star profile:", error);
    return false;
  }
}

export async function unstarProfile(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "delete",
      url: `${SOCIAL_BASE_PATH}/stars/${userId}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to unstar profile:", error);
    return false;
  }
}

export async function getStarredProfiles(): Promise<any[]> {
  try {
    return await apiRequest<any[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/stars`,
    });
  } catch (error) {
    console.error("Failed to fetch starred profiles:", error);
    return [];
  }
}

// Watch Profile
export async function watchProfile(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/watches`,
      data: { watched_user_id: userId },
    });
    return true;
  } catch (error) {
    console.error("Failed to watch profile:", error);
    return false;
  }
}

export async function unwatchProfile(userId: number): Promise<boolean> {
  try {
    await apiRequest({
      method: "delete",
      url: `${SOCIAL_BASE_PATH}/watches/${userId}`,
    });
    return true;
  } catch (error) {
    console.error("Failed to unwatch profile:", error);
    return false;
  }
}

// Ratings & Reviews
export async function getRatingSummary(profileId: number): Promise<RatingSummary | null> {
  try {
    return await apiRequest<RatingSummary>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/ratings/user/${profileId}/summary`,
    });
  } catch (error) {
    console.error("Failed to fetch rating summary:", error);
    return null;
  }
}

export async function getReviews(profileId: number, limit: number = 10): Promise<Rating[]> {
  try {
    return await apiRequest<Rating[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/ratings/user/${profileId}`,
      params: { limit },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

export async function submitReview(profileId: number, rating: number, comment?: string): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/ratings`,
      data: { rated_user_id: profileId, score: rating, review: comment },
    });
    return true;
  } catch (error) {
    console.error("Failed to submit review:", error);
    return false;
  }
}

// Connections
export async function getConnectionStatus(userId: number): Promise<ConnectionStatus> {
  try {
    const result = await apiRequest<{ status: ConnectionStatus }>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/stats/${userId}`,
    });
    return result.status;
  } catch (error) {
    console.error("Failed to get connection status:", error);
    return "none";
  }
}

export async function requestConnection(userId: number, message?: string): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/connections`,
      data: { addressee_id: userId, message },
    });
    return true;
  } catch (error) {
    console.error("Failed to send connection request:", error);
    return false;
  }
}

export async function respondToConnectionRequest(requestId: string, accept: boolean): Promise<boolean> {
  try {
    await apiRequest({
      method: "post",
      url: `${SOCIAL_BASE_PATH}/connections/${requestId}`,
      data: { status: accept ? 'accepted' : 'rejected' },
    });
    return true;
  } catch (error) {
    console.error("Failed to respond to connection request:", error);
    return false;
  }
}

export async function getPendingRequests(): Promise<ConnectionRequest[]> {
  try {
    return await apiRequest<ConnectionRequest[]>({
      method: "get",
      url: `${SOCIAL_BASE_PATH}/connections/pending`,
    });
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    return [];
  }
}

const socialService = {
  // Follows
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  // Stars
  starProfile,
  unstarProfile,
  getStarredProfiles,
  // Watch
  watchProfile,
  unwatchProfile,
  // Endorsements
  getSkillEndorsements,
  endorseSkill,
  removeEndorsement,
  // Ratings
  getRatingSummary,
  getReviews,
  submitReview,
  // Connections
  getConnectionStatus,
  requestConnection,
  respondToConnectionRequest,
  getPendingRequests,
};

export default socialService;
