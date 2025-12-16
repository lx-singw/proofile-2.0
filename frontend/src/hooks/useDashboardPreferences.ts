import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export interface DashboardPreferences {
    visibleSections: {
        welcome: boolean;
        stats: boolean;
        resumeTools: boolean;
        profileVerification: boolean;
        jobDiscovery: boolean;
        recentActivity: boolean;
    };
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
    visibleSections: {
        welcome: true,
        stats: true,
        resumeTools: true,
        profileVerification: true,
        jobDiscovery: true,
        recentActivity: true,
    },
};

export function useDashboardPreferences() {
    const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const data = await apiRequest<DashboardPreferences>({
                method: 'get',
                url: '/api/v1/users/me/preferences',
            });
            if (data && data.visibleSections) {
                setPreferences(data);
            }
        } catch (error: any) {
            console.error('Failed to load preferences:', {
                message: error?.message || 'Unknown error',
                detail: error?.detail || error?.error || 'No details',
                status: error?.status,
                full: error
            });
            // Use defaults on error
        } finally {
            setLoading(false);
        }
    };

    const updatePreferences = async (newPreferences: DashboardPreferences) => {
        setPreferences(newPreferences); // Optimistic update
        try {
            await apiRequest({
                method: 'put',
                url: '/api/v1/users/me/preferences',
                data: newPreferences,
            });
        } catch (error: any) {
            console.error('Failed to update preferences:', {
                message: error?.message || 'Unknown error',
                detail: error?.detail || error?.error || 'No details',
                full: error
            });
            // Revert on failure could be added here
        }
    };

    const toggleSection = (section: keyof DashboardPreferences['visibleSections']) => {
        const newPreferences = {
            ...preferences,
            visibleSections: {
                ...preferences.visibleSections,
                [section]: !preferences.visibleSections[section],
            },
        };
        updatePreferences(newPreferences);
    };

    return {
        preferences,
        loading,
        toggleSection,
        updatePreferences,
    };
}
