import { toast as sonnerToast } from "sonner";

/**
 * Centralized toast utilities
 * Provides consistent messaging across the app
 */
export const toast = {
    success: (message: string, description?: string) => {
        return sonnerToast.success(message, {
            description,
        });
    },

    error: (message: string, description?: string) => {
        return sonnerToast.error(message, {
            description,
        });
    },

    info: (message: string, description?: string) => {
        return sonnerToast.info(message, {
            description,
        });
    },

    loading: (message: string) => {
        return sonnerToast.loading(message);
    },

    promise: <T,>(
        promise: Promise<T>,
        {
            loading,
            success,
            error,
        }: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => {
        return sonnerToast.promise(promise, {
            loading,
            success,
            error,
        });
    },
};
