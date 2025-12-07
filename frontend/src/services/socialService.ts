/**
 * Social interactions service: Follow, Connect, Star, Endorse, Rate, Watch
 */
import { apiRequest } from "@/lib/api";

// ============ Types ============
export interface FollowResponse {
  id: number;
  follower_id: number;
  following_id: number;
  created_at: string;
}

export interface ConnectionResponse {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileStarResponse {
  id: number;
  user_id: number;
  starred_user_id: number;
  created_at: string;
}

export interface ProfileWatchResponse {
  id: number;
  user_id: number;
  watched_user_id: number;
  created_at: string;
}

export interface EndorsementResponse {
  id: number;
  endorser_id: number;
  endorsed_user_id: number;
  skill: string;
  comment: string | null;
  created_at: string;
}

export interface RatingResponse {
  id: number;
  rater_id: number | null;
  rated_user_id: number;
  score: number;
  category: string;
  review: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface RatingSummary {
  average_score: number;
  total_ratings: number;
  category_scores: Record<string, number>;
}

export interface ProfileSocialStats {
  followers_count: number;
  following_count: number;
  connections_count: number;
  stars_count: number;
  endorsements_count: number;
  ratings_count: number;
  average_rating: number | null;
  is_following: boolean;
  is_connected: boolean;
  is_starred: boolean;
  is_watching: boolean;
  connection_status: string | null;
}

// ============ Follow Functions ============
export async function followUser(userId: number): Promise<FollowResponse> {
  return apiRequest<FollowResponse>({
    url: "/api/v1/social/follow",
    method: "POST",
    data: { following_id: userId },
  });
}

export async function unfollowUser(userId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/social/follow/${userId}`,
    method: "DELETE",
  });
}

export async function getFollowers(): Promise<FollowResponse[]> {
  return apiRequest<FollowResponse[]>({
    url: "/api/v1/social/followers",
    method: "GET",
  });
}

export async function getFollowing(): Promise<FollowResponse[]> {
  return apiRequest<FollowResponse[]>({
    url: "/api/v1/social/following",
    method: "GET",
  });
}

// ============ Connection Functions ============
export async function requestConnection(
  userId: number,
  message?: string
): Promise<ConnectionResponse> {
  return apiRequest<ConnectionResponse>({
    url: "/api/v1/social/connections",
    method: "POST",
    data: { addressee_id: userId, message },
  });
}

export async function respondToConnection(
  connectionId: number,
  status: "accepted" | "rejected"
): Promise<ConnectionResponse> {
  return apiRequest<ConnectionResponse>({
    url: `/api/v1/social/connections/${connectionId}`,
    method: "PATCH",
    data: { status },
  });
}

export async function removeConnection(connectionId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/social/connections/${connectionId}`,
    method: "DELETE",
  });
}

export async function getConnections(
  status?: string
): Promise<ConnectionResponse[]> {
  const params = status ? `?status_filter=${status}` : "";
  return apiRequest<ConnectionResponse[]>({
    url: `/api/v1/social/connections${params}`,
    method: "GET",
  });
}

export async function getPendingConnections(): Promise<ConnectionResponse[]> {
  return apiRequest<ConnectionResponse[]>({
    url: "/api/v1/social/connections/pending",
    method: "GET",
  });
}

// ============ Star Functions ============
export async function starProfile(userId: number): Promise<ProfileStarResponse> {
  return apiRequest<ProfileStarResponse>({
    url: "/api/v1/social/stars",
    method: "POST",
    data: { starred_user_id: userId },
  });
}

export async function unstarProfile(userId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/social/stars/${userId}`,
    method: "DELETE",
  });
}

export async function getStarredProfiles(): Promise<ProfileStarResponse[]> {
  return apiRequest<ProfileStarResponse[]>({
    url: "/api/v1/social/stars",
    method: "GET",
  });
}

// ============ Watch Functions ============
export async function watchProfile(
  userId: number
): Promise<ProfileWatchResponse> {
  return apiRequest<ProfileWatchResponse>({
    url: "/api/v1/social/watches",
    method: "POST",
    data: { watched_user_id: userId },
  });
}

export async function unwatchProfile(userId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/social/watches/${userId}`,
    method: "DELETE",
  });
}

// ============ Endorsement Functions ============
export async function endorseSkill(
  userId: number,
  skill: string,
  comment?: string
): Promise<EndorsementResponse> {
  return apiRequest<EndorsementResponse>({
    url: "/api/v1/social/endorsements",
    method: "POST",
    data: { endorsed_user_id: userId, skill, comment },
  });
}

export async function removeEndorsement(endorsementId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/social/endorsements/${endorsementId}`,
    method: "DELETE",
  });
}

export async function getReceivedEndorsements(): Promise<EndorsementResponse[]> {
  return apiRequest<EndorsementResponse[]>({
    url: "/api/v1/social/endorsements/received",
    method: "GET",
  });
}

export async function getUserEndorsements(
  userId: number
): Promise<EndorsementResponse[]> {
  return apiRequest<EndorsementResponse[]>({
    url: `/api/v1/social/endorsements/user/${userId}`,
    method: "GET",
  });
}

// ============ Rating Functions ============
export async function rateUser(
  userId: number,
  score: number,
  category: string,
  review?: string,
  isAnonymous?: boolean
): Promise<RatingResponse> {
  return apiRequest<RatingResponse>({
    url: "/api/v1/social/ratings",
    method: "POST",
    data: {
      rated_user_id: userId,
      score,
      category,
      review,
      is_anonymous: isAnonymous ?? false,
    },
  });
}

export async function getReceivedRatings(): Promise<RatingResponse[]> {
  return apiRequest<RatingResponse[]>({
    url: "/api/v1/social/ratings/received",
    method: "GET",
  });
}

export async function getUserRatingSummary(
  userId: number
): Promise<RatingSummary> {
  return apiRequest<RatingSummary>({
    url: `/api/v1/social/ratings/user/${userId}/summary`,
    method: "GET",
  });
}

// ============ Stats Functions ============
export async function getProfileSocialStats(
  userId: number
): Promise<ProfileSocialStats> {
  return apiRequest<ProfileSocialStats>({
    url: `/api/v1/social/stats/${userId}`,
    method: "GET",
  });
}

// Export as default object for convenience
export const socialService = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  requestConnection,
  respondToConnection,
  removeConnection,
  getConnections,
  getPendingConnections,
  starProfile,
  unstarProfile,
  getStarredProfiles,
  watchProfile,
  unwatchProfile,
  endorseSkill,
  removeEndorsement,
  getReceivedEndorsements,
  getUserEndorsements,
  rateUser,
  getReceivedRatings,
  getUserRatingSummary,
  getProfileSocialStats,
};
