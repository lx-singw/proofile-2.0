import { apiRequest } from '@/lib/api';

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

export const notificationService = {
    async getNotifications(skip: number = 0, limit: number = 20): Promise<Notification[]> {
        return apiRequest<Notification[]>({
            method: 'get',
            url: '/api/v1/notifications',
            params: { skip, limit },
        });
    },

    async getUnreadCount(): Promise<number> {
        return apiRequest<number>({
            method: 'get',
            url: '/api/v1/notifications/unread-count',
        });
    },

    async markAsRead(id: number): Promise<Notification> {
        return apiRequest<Notification>({
            method: 'post',
            url: `/api/v1/notifications/${id}/read`,
        });
    },

    async markAllAsRead(): Promise<void> {
        return apiRequest<void>({
            method: 'post',
            url: '/api/v1/notifications/read-all',
        });
    },
};
