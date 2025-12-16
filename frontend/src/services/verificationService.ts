import { apiRequest } from "../lib/api";

export interface Verification {
  id: number;
  user_id: number;
  verification_type: "email" | "phone" | "identity" | "education" | "employment" | "skills";
  status: "pending" | "verified" | "expired" | "not_started";
  verification_data?: string; // JSON
  verified_value?: string;
  verified_at?: string;
  trust_level?: "L1" | "L2" | "L3" | "L4" | "L5";
  trust_points?: number;
}

export interface VerificationSummary {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  verification_score: number;
  verifications: Verification[];
}

export async function getVerificationSummary(): Promise<VerificationSummary> {
  return apiRequest<VerificationSummary>({
    method: "get",
    url: "/api/v1/verifications/summary",
  });
}

export async function initiateEmailVerification(email: string): Promise<{ message: string; debug_token?: string }> {
  return apiRequest({
    method: "post",
    url: "/api/v1/verifications/email/initiate",
    data: { email },
  });
}

export async function confirmEmailVerification(token: string): Promise<Verification> {
  return apiRequest<Verification>({
    method: "post",
    url: "/api/v1/verifications/email/confirm",
    data: { token },
  });
}

export async function createVerification(data: {
  verification_type: string;
  verification_data: string;
}): Promise<Verification> {
  return apiRequest<Verification>({
    method: "post",
    url: "/api/v1/verifications",
    data,
  });
}

const verificationService = {
  getVerificationSummary,
  initiateEmailVerification,
  confirmEmailVerification,
  createVerification
};

export default verificationService;
