/**
 * Stripe Identity Service
 * Client-side wrapper for Stripe Identity verification flows
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
        );
    }
    return stripePromise;
};

export interface VerificationSession {
    id: string;
    client_secret: string;
    status: "requires_input" | "processing" | "verified" | "canceled";
    url?: string;
}

export interface InitiateVerificationResponse {
    session: VerificationSession;
    client_secret: string;
}

/**
 * Initiate a new identity verification session
 */
export async function initiateIdentityVerification(): Promise<InitiateVerificationResponse> {
    const response = await fetch("/api/v1/verify/identity/init", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to initiate verification");
    }

    return response.json();
}

/**
 * Open the Stripe Identity modal for verification
 */
export async function openVerificationModal(clientSecret: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const stripe = await getStripe();
    if (!stripe) {
        return { success: false, error: "Stripe not loaded" };
    }

    try {
        const result = await stripe.verifyIdentity(clientSecret);

        if (result.error) {
            return { success: false, error: result.error.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        };
    }
}

/**
 * Check the status of a verification session
 */
export async function getVerificationStatus(sessionId: string): Promise<VerificationSession> {
    const response = await fetch(`/api/v1/verify/identity/status/${sessionId}`);

    if (!response.ok) {
        throw new Error("Failed to get verification status");
    }

    return response.json();
}

/**
 * Full verification flow - initiates and opens the modal
 */
export async function startVerificationFlow(): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
}> {
    try {
        // 1. Initiate session on backend
        const { client_secret, session } = await initiateIdentityVerification();

        // 2. Open Stripe modal
        const result = await openVerificationModal(client_secret);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true, sessionId: session.id };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Verification failed",
        };
    }
}

export default {
    initiateIdentityVerification,
    openVerificationModal,
    getVerificationStatus,
    startVerificationFlow,
};
