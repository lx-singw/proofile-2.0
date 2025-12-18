import api from "@/lib/api";

export interface PeerOpportunity {
  user: {
    id: number;
    full_name: string;
    headline?: string;
    avatar_url?: string;
  };
  company: string;
  role?: string;
  period?: string;
}

export interface PeerVerificationRequest {
  id: number;
  requester_id: number;
  verifier_id: number;
  company: string;
  role?: string;
  status: "pending" | "verified" | "denied" | "ignored";
  message?: string;
  response_note?: string;
  created_at: string;
  requester?: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
}

const verificationService = {
  getOpportunities: async (): Promise<PeerOpportunity[]> => {
    const response = await api.get("/verifications/peer/opportunities");
    return response.data;
  },

  requestVerification: async (data: {
    verifier_id: number;
    company: string;
    experience_id?: string;
    role?: string;
    start_date?: string;
    end_date?: string;
    message?: string;
  }): Promise<PeerVerificationRequest> => {
    const response = await api.post("/verifications/peer/request", data);
    return response.data;
  },

  getPendingRequests: async (): Promise<PeerVerificationRequest[]> => {
    const response = await api.get("/verifications/peer/pending");
    return response.data;
  },

  respondToRequest: async (requestId: number, action: "verify" | "deny", note?: string): Promise<{ status: string }> => {
    const response = await api.post(`/verifications/peer/${requestId}/respond`, null, {
      params: { action, response_note: note }
    });
    return response.data;
  }
};

export default verificationService;
