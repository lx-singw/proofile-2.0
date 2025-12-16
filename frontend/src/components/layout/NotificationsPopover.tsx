"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink, Inbox } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { notificationService, Notification } from "@/services/notificationService";
import { toast } from "@/lib/toast";

interface NotificationsPopoverProps {
    unreadCount: number;
    onCountChange: (count: number) => void;
    trigger: React.ReactNode;
}

export default function NotificationsPopover({
    unreadCount,
    onCountChange,
    trigger
}: NotificationsPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Close on click outside
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const [data, count] = await Promise.all([
                notificationService.getNotifications(0, 50),
                notificationService.getUnreadCount()
            ]);
            setNotifications(data);
            onCountChange(count);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            loadNotifications();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            onCountChange(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            onCountChange(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    return (
        <div className="relative" ref={popoverRef}>
            <div onClick={handleToggle} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell className="w-4 h-4" /> Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg border transition-all ${notification.read
                                        ? "bg-transparent border-transparent opacity-75"
                                        : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.type === 'success' ? 'bg-green-500' :
                                            notification.type === 'warning' ? 'bg-emerald-500' : 'bg-emerald-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-medium text-gray-900 dark:text-white ${!notification.read ? 'font-bold' : ''}`}>
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                                {notification.link && (
                                                    <Link
                                                        href={notification.link}
                                                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                                                        onClick={() => {
                                                            if (!notification.read) markAsRead(notification.id);
                                                            setIsOpen(false);
                                                        }}
                                                    >
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                )}
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
