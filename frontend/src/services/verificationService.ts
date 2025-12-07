/**
 * Verification service: Email, phone, identity, education, employment verification
 */
import { apiRequest } from "@/lib/api";

// ============ Types ============
export interface Verification {
  id: number;
  user_id: number;
  verification_type: string;
  status: "not_started" | "pending" | "verified" | "failed" | "expired";
  verification_data: string | null;
  document_url: string | null;
  verified_value: string | null;
  verification_provider: string | null;
  verified_at: string | null;
  expires_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationSummary {
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  education_verified: boolean;
  employment_verified: boolean;
  skills_verified: boolean;
  verification_score: number;
  verifications: Verification[];
}

// ============ Verification Functions ============
export async function getVerifications(): Promise<Verification[]> {
  return apiRequest<Verification[]>({
    url: "/api/v1/verifications/",
    method: "GET",
  });
}

export async function getVerificationSummary(): Promise<VerificationSummary> {
  return apiRequest<VerificationSummary>({
    url: "/api/v1/verifications/summary",
    method: "GET",
  });
}

export async function initiateEmailVerification(
  email: string
): Promise<{ message: string; debug_token?: string }> {
  return apiRequest<{ message: string; debug_token?: string }>({
    url: "/api/v1/verifications/email/initiate",
    method: "POST",
    data: { email },
  });
}

export async function confirmEmailVerification(
  token: string
): Promise<Verification> {
  return apiRequest<Verification>({
    url: "/api/v1/verifications/email/confirm",
    method: "POST",
    data: { token },
  });
}

export async function initiatePhoneVerification(
  phone: string
): Promise<{ message: string; debug_code?: string }> {
  return apiRequest<{ message: string; debug_code?: string }>({
    url: "/api/v1/verifications/phone/initiate",
    method: "POST",
    data: { phone },
  });
}

export async function confirmPhoneVerification(
  code: string
): Promise<Verification> {
  return apiRequest<Verification>({
    url: "/api/v1/verifications/phone/confirm",
    method: "POST",
    data: { code },
  });
}

export async function createVerification(
  verificationType: string,
  verificationData?: string
): Promise<Verification> {
  return apiRequest<Verification>({
    url: "/api/v1/verifications/",
    method: "POST",
    data: {
      verification_type: verificationType,
      verification_data: verificationData,
    },
  });
}

export async function updateVerification(
  verificationId: number,
  data: { verification_data?: string; document_url?: string }
): Promise<Verification> {
  return apiRequest<Verification>({
    url: `/api/v1/verifications/${verificationId}`,
    method: "PATCH",
    data,
  });
}

export async function deleteVerification(verificationId: number): Promise<void> {
  return apiRequest<void>({
    url: `/api/v1/verifications/${verificationId}`,
    method: "DELETE",
  });
}

// Export as default object for convenience
export const verificationService = {
  getVerifications,
  getVerificationSummary,
  initiateEmailVerification,
  confirmEmailVerification,
  initiatePhoneVerification,
  confirmPhoneVerification,
  createVerification,
  updateVerification,
  deleteVerification,
};
