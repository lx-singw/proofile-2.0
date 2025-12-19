"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, Bell, User as UserIcon, LogOut, Settings, LayoutDashboard, Compass, Briefcase, Zap } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import useAuth from "@/hooks/useAuth";
import NotificationsPopover from "@/components/layout/NotificationsPopover";
import NotificationBell from "@/components/layout/NotificationBell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function HomeHeader() {
    const { user, logout } = useAuth();
    const [productOpen, setProductOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    useEffect(() => {
        if (user) {
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
            setShowLogoutConfirm(false);
        }
    };

    /**
     * Logic check for "Account User" vs "Anonymous" (Guest)
     * as defined in docs/development/feed_dashboard_transformation_plan.md
     */
    const isAccountUser = !!user;

    return (
        <header className="relative border-b border-emerald-200/50 dark:border-emerald-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
            {/* Subtle gradient line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/home" className="flex flex-col">
                            <ProofileLogo size={32} showWordmark={true} />
                            {!isAccountUser ? (
                                <span className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ml-10">
                                    Beyond resumes. Proven digital professional identities.
                                </span>
                            ) : (
                                <span className="hidden sm:block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 ml-10 uppercase tracking-tighter">
                                    Smart Feed
                                </span>
                            )}
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {!isAccountUser ? (
                                <>
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setProductOpen(true)}
                                        onMouseLeave={() => setProductOpen(false)}
                                    >
                                        <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                            Product
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {productOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Link href="/#verification" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                                    <div className="font-semibold mb-1">Verification</div>
                                                    <div className="text-xs text-gray-500">Multi-layer credential verification</div>
                                                </Link>
                                                <Link href="/#ratings" className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                                    <div className="font-semibold mb-1">Peer Ratings</div>
                                                    <div className="text-xs text-gray-500">Real feedback from colleagues</div>
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <Link href="/portal" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        Opportunities
                                    </Link>

                                    <Link href="/companies" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                        Companies
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/home" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Feed
                                    </Link>

                                    <Link href="/opportunities" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        Matches
                                    </Link>

                                    <Link href="/explore" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <Compass className="w-4 h-4" />
                                        Explore
                                    </Link>

                                    <Link href="/tools" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <Zap className="w-4 h-4" />
                                        Tools
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle />

                        {user ? (
                            /* Logged In Actions (Account User) */
                            <div className="flex items-center gap-2 sm:gap-4">
                                <NotificationsPopover
                                    unreadCount={unreadCount}
                                    onCountChange={setUnreadCount}
                                    trigger={<NotificationBell unreadCount={unreadCount} />}
                                />

                                <div
                                    className="relative"
                                    onMouseEnter={() => setUserDropdownOpen(true)}
                                    onMouseLeave={() => setUserDropdownOpen(false)}
                                >
                                    <button className="flex items-center gap-2 p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20">
                                            {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                        </div>
                                    </button>

                                    {userDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.full_name || 'Account User'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username || 'user'}</p>
                                            </div>
                                            <div className="p-1">
                                                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    Dashboard
                                                </Link>
                                                <Link href={`/p/${user.username || 'unknown'}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                                                    <UserIcon className="w-4 h-4" />
                                                    Profile
                                                </Link>
                                                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowLogoutConfirm(true);
                                                    }}
                                                    disabled={logoutLoading}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1 disabled:opacity-50"
                                                >
                                                    {logoutLoading ? (
                                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <LogOut className="w-4 h-4" />
                                                    )}
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Guest Actions (Anonymous User) */
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200">
                                    Sign in
                                </Link>
                                <Link href="/start" className="hidden sm:inline-flex px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg hover:scale-[1.02]">
                                    Get started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="lg:hidden p-2 text-gray-500 dark:text-gray-400"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden py-4 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                        <nav className="space-y-1 px-2">
                            {isAccountUser ? (
                                <>
                                    <Link href="/home" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Feed
                                    </Link>
                                    <Link href="/opportunities" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Matches
                                    </Link>
                                    <Link href="/explore" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Explore
                                    </Link>
                                    <Link href="/tools" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Tools
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/portal" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Opportunities
                                    </Link>
                                    <Link href="/companies" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Companies
                                    </Link>
                                </>
                            )}

                            {isAccountUser && (
                                <>
                                    <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Dashboard
                                    </Link>
                                    <Link href={`/p/${user.username || 'unknown'}`} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                        Profile
                                    </Link>
                                </>
                            )}
                        </nav>
                        {!isAccountUser && (
                            <div className="mt-4 px-5">
                                <Link href="/start" className="block w-full py-3 bg-emerald-600 text-white text-center font-bold rounded-xl shadow-lg">
                                    Get started free
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Sign Out?"
                message="Are you sure you want to sign out? You'll need to log in again to access your account."
                confirmText="Sign Out"
                cancelText="Stay Logged In"
                variant="danger"
            />
        </header>
    );
}

export default HomeHeader;
