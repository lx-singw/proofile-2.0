import { apiRequest } from '@/lib/api';

export interface OnboardingResponse {
    url: string;
}

export interface OnboardingStatus {
    is_onboarded: boolean;
}

export interface PaymentUrlResponse {
    url: string;
}

export const paymentService = {
    /**
     * Get Stripe onboarding link
     */
    async getOnboardingLink(returnUrl: string, refreshUrl: string): Promise<OnboardingResponse> {
        return apiRequest({
            method: 'POST',
            url: '/api/v1/payments/onboard',
            data: {
                return_url: returnUrl,
                refresh_url: refreshUrl
            }
        });
    },

    /**
     * Check onboarding status
     */
    async getOnboardingStatus(): Promise<OnboardingStatus> {
        return apiRequest({
            method: 'GET',
            url: '/api/v1/payments/onboarding-status'
        });
    },

    /**
     * Initiate a paid message to a user
     */
    async initiatePaidMessage(params: {
        recipientId: number;
        amount: number;
        message: string;
        successUrl: string;
        cancelUrl: string;
    }): Promise<PaymentUrlResponse> {
        return apiRequest({
            method: 'POST',
            url: '/api/v1/payments/paid-inbox/initiate',
            data: {
                recipient_id: params.recipientId,
                amount: params.amount,
                message: params.message,
                success_url: params.successUrl,
                cancel_url: params.cancelUrl
            }
        });
    }
};

export default paymentService;
