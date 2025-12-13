import { apiRequest } from "../lib/api";

export interface Verification {
  id: number;
  user_id: number;
  verification_type: "email" | "phone" | "identity" | "education" | "employment" | "skills";
  status: "pending" | "verified" | "expired" | "not_started";
  verification_data?: string; // JSON
  verified_value?: string;
  verified_at?: string;
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

const verificationService = {
  getVerificationSummary,
  initiateEmailVerification,
  confirmEmailVerification
};

export default verificationService;
