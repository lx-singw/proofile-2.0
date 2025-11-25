"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ProofileLogo from "@/components/branding/ProofileLogo";
import NotificationBell from "./NotificationBell";
import DashboardDropdown from "./DashboardDropdown";
import { Settings, LogOut, LayoutDashboard, FileText, User } from "lucide-react";

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
 * - Notifications and user menu
 * - Clean, modern design
 */
export default function DashboardHeader({
  unreadNotifications = 0,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo */}
          <div className="flex flex-col">
            <Link href="/dashboard">
              <ProofileLogo size={32} showWordmark={true} />
            </Link>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-10">
              Beyond resumes. Proven digital professional identities.
            </span>
          </div>

          {/* Center Section: Navigation */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FileText className="w-4 h-4" />
              Resume Builder
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </nav>

          {/* Right Section: Notifications & User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <NotificationBell unreadCount={unreadNotifications} />

            {/* User Menu Dropdown */}
            <DashboardDropdown
              trigger={
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                </div>
              }
              items={[
                {
                  label: "Dashboard",
                  href: "/dashboard",
                  icon: <LayoutDashboard className="w-4 h-4" />,
                },
                {
                  label: "Professional Profile",
                  href: "/profile",
                  icon: <FileText className="w-4 h-4" />,
                },
                {
                  label: "Account Settings",
                  href: "/settings",
                  icon: <Settings className="w-4 h-4" />,
                },
                {
                  label: "Sign Out",
                  href: "/logout",
                  icon: <LogOut className="w-4 h-4" />,
                  divider: true,
                },
              ]}
              align="right"
              onItemClick={async (item, event) => {
                if (item.label === "Sign Out") {
                  event?.preventDefault();
                  await handleLogout();
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
