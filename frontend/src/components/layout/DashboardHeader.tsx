"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import ProofileLogo from "@/components/branding/ProofileLogo";
import NotificationBell from "./NotificationBell";
import DashboardDropdown from "./DashboardDropdown";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LEFT_MENU_ITEMS, RIGHT_MENU_ITEMS } from "@/config/navigation";

interface DashboardHeaderProps {
  unreadNotifications?: number;
}

/**
 * DashboardHeader
 * 
 * Redesigned header component matching home page aesthetic.
 * Features:
 * - ProofileLogo with tagline
 * - Simplified navigation menu
 * - Theme toggle
 * - Notifications and user menu
 * - Clean, modern design
 */
export default function DashboardHeader({
  unreadNotifications = 0,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(unreadNotifications);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      // Import dynamically to avoid circular dependencies if any
      import('@/services/notificationService').then(({ notificationService }) => {
        notificationService.getUnreadCount()
          .then(setUnreadCount)
          .catch(console.error);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!user) {
    return (
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="w-6 h-6" />
              </span>
              <span className="ml-2 text-gray-400 animate-pulse">Loading...</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu (visible on small screens, or always if that's the design) */}
            <DashboardDropdown
              trigger={
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              }
              triggerClassName="inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              items={LEFT_MENU_ITEMS}
              align="left"
            />

            <Link href="/dashboard" className="flex items-center gap-2">
              <ProofileLogo size={32} showWordmark={true} />
            </Link>
          </div>

          {/* Right Section: Theme Toggle, Notifications & User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationBell unreadCount={unreadCount} />

            <DashboardDropdown
              trigger={
                <>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  {user.avatarUrl ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                      <Image
                        src={user.avatarUrl}
                        alt="Profile picture"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  {logoutLoading && (
                    <span className="ml-2 animate-spin text-green-600">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    </span>
                  )}
                </>
              }
              triggerClassName="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              items={RIGHT_MENU_ITEMS}
              align="right"
              onItemClick={async (item, event) => {
                if (item.label === "Sign Out") {
                  event?.preventDefault();
                  setShowLogoutConfirm(true);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out?"
        message="Are you sure you want to sign out? You'll need to log in again to access your dashboard."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        variant="danger"
      />
    </header>
  );
}
