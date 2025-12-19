"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import MobileNav from "@/components/layout/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

/**
 * AppShell - Global layout wrapper
 * 
 * Provides:
 * - Persistent DashboardHeader across all authenticated pages
 * - Global keyboard shortcuts (press ? for help)
 * - Breadcrumb navigation
 * 
 * Excludes public routes like login, register, home, onboarding.
 */

// Routes that should NOT show the DashboardHeader
const PUBLIC_ROUTES = [
    "/",
    "/home",
    "/login",
    "/register",
    "/onboarding",
    "/start",
    "/rate", // Public rating form
];

// Routes that start with these prefixes are public
const PUBLIC_PREFIXES = [
    "/p/", // Public profile pages
    "/share/",
];

function isPublicRoute(pathname: string): boolean {
    // Exact matches
    if (PUBLIC_ROUTES.includes(pathname)) {
        return true;
    }

    // Prefix matches
    for (const prefix of PUBLIC_PREFIXES) {
        if (pathname.startsWith(prefix)) {
            return true;
        }
    }

    return false;
}

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    // Initialize keyboard shortcuts
    useKeyboardShortcuts(() => setIsShortcutsOpen(true));

    // Don't show header on public routes
    const showHeader = !isPublicRoute(pathname);

    // Don't show header if not logged in (except loading state)
    const isAuthenticated = !!user || loading;

    if (!showHeader || !isAuthenticated) {
        const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/onboarding";
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30 transition-colors duration-500 flex flex-col">
                {!showHeader && !isAuthPage && <HomeHeader />}
                <main className="flex-1">
                    {children}
                </main>
                <MobileNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30 transition-colors duration-500">
            <HomeHeader />
            <main className="flex-1">
                {/* Breadcrumb Navigation - only show on non-public routes */}
                {showHeader && isAuthenticated && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                        <Breadcrumbs />
                    </div>
                )}
                {children}
            </main>

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />

            {/* Keyboard shortcut hint */}
            <div className="fixed bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600 hidden lg:block">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">?</kbd> for shortcuts
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    );
}
