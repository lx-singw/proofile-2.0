"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Bell, User as UserIcon, LogOut, Settings, LayoutDashboard, Compass, Briefcase, Zap, Info, ShieldCheck, Star, Building2, Search, Users, Trophy, BarChart3, Bot, Rocket, UserPlus, Share2, Sparkles, ClipboardCheck } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import useAuth from "@/hooks/useAuth";
import NotificationsPopover from "@/components/layout/NotificationsPopover";
import NotificationBell from "@/components/layout/NotificationBell";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function HomeHeader() {
    const { user, logout } = useAuth();
    const [productOpen, setProductOpen] = useState(false);
    const [proofileMenuOpen, setProofileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [activeNav, setActiveNav] = useState<string | null>(null);
    const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
    const proofileMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const headerRef = useRef<HTMLElement>(null);
    const userMenuCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openProofileMenu = () => {
        if (proofileMenuCloseTimeoutRef.current) {
            clearTimeout(proofileMenuCloseTimeoutRef.current);
            proofileMenuCloseTimeoutRef.current = null;
        }
        setProofileMenuOpen(true);
    };

    const closeProofileMenuWithDelay = () => {
        if (proofileMenuCloseTimeoutRef.current) {
            clearTimeout(proofileMenuCloseTimeoutRef.current);
        }
        proofileMenuCloseTimeoutRef.current = setTimeout(() => {
            setProofileMenuOpen(false);
        }, 120);
    };

    const openUserMenu = () => {
        if (userMenuCloseTimeoutRef.current) {
            clearTimeout(userMenuCloseTimeoutRef.current);
            userMenuCloseTimeoutRef.current = null;
        }
        setUserDropdownOpen(true);
    };

    const closeUserMenuWithDelay = () => {
        if (userMenuCloseTimeoutRef.current) {
            clearTimeout(userMenuCloseTimeoutRef.current);
        }
        userMenuCloseTimeoutRef.current = setTimeout(() => {
            setUserDropdownOpen(false);
        }, 120);
    };

    const openNav = (name: string) => {
        if (navCloseTimeoutRef.current) {
            clearTimeout(navCloseTimeoutRef.current);
            navCloseTimeoutRef.current = null;
        }
        setActiveNav(name);
    };

    const closeNavWithDelay = () => {
        if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
        navCloseTimeoutRef.current = setTimeout(() => setActiveNav(null), 120);
    };

    useEffect(() => {
        if (user) {
            import('@/services/notificationService').then(({ notificationService }) => {
                notificationService.getUnreadCount()
                    .then(setUnreadCount)
                    .catch(console.error);
            });
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
                setProofileMenuOpen(false);
                setActiveNav(null);
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (proofileMenuCloseTimeoutRef.current) clearTimeout(proofileMenuCloseTimeoutRef.current);
            if (userMenuCloseTimeoutRef.current) clearTimeout(userMenuCloseTimeoutRef.current);
            if (navCloseTimeoutRef.current) clearTimeout(navCloseTimeoutRef.current);
        };
    }, []);

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

    const pathname = usePathname();

    // Map current pathname to which top-nav section is "active"
    const activeSection = (() => {
        if (['/opportunities', '/verification', '/reputation', '/verification/history'].some(p => pathname.startsWith(p))) return 'career';
        if (['/explore', '/discover', '/companies', '/network', '/guilds', '/showcase'].some(p => pathname.startsWith(p))) return 'discover';
        if (['/home', '/tools', '/analytics', '/ai-assistant'].some(p => pathname.startsWith(p))) return 'workspace';
        if (['/start', '/register', '/onboarding', '/share', '/about'].some(p => pathname.startsWith(p))) return 'getting-started';
        return null;
    })();

    // Reusable class builder for top nav section triggers
    const navBtnClass = (section: string) => {
        const isActive = activeSection === section;
        return `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all duration-200 rounded-md ${
            isActive
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500 rounded-b-none bg-emerald-50/60 dark:bg-emerald-900/20'
                : 'text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`;
    };

    return (
        <header ref={headerRef} className="relative border-b border-emerald-200/50 dark:border-emerald-800/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
            {/* Subtle gradient line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            {isAccountUser && (
                                <div className="relative lg:hidden">
                                    <button
                                        type="button"
                                        aria-label="Open Proofile menu"
                                        aria-expanded={proofileMenuOpen}
                                        onClick={() => {
                                            setUserDropdownOpen(false);
                                            const next = !proofileMenuOpen;
                                            setProofileMenuOpen(next);
                                            if (next) setOpenMobileSection(activeSection);
                                        }}
                                        onMouseEnter={() => {
                                            setUserDropdownOpen(false);
                                            openProofileMenu();
                                        }}
                                        onFocus={openProofileMenu}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-white/90 text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-400 hover:text-emerald-700 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                                    >
                                        {proofileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                    </button>

                                    {proofileMenuOpen && (
                                        <div
                                            className="absolute top-full left-0 mt-1 w-72 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
                                        >
                                            <div className="p-2">
                                                {/* Career */}
                                                <button
                                                    onClick={() => setOpenMobileSection(s => s === 'career' ? null : 'career')}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg ${
                                                        activeSection === 'career' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                                                    } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                                >
                                                    Career
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMobileSection === 'career' ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openMobileSection === 'career' && (
                                                    <div className="ml-2 mb-1">
                                                        <Link href="/opportunities" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Briefcase className="w-4 h-4" />Opportunities</Link>
                                                        <Link href="/verification" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><ShieldCheck className="w-4 h-4" />Verification</Link>
                                                        <Link href="/reputation" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Star className="w-4 h-4" />Ratings</Link>
                                                    </div>
                                                )}

                                                <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                                                {/* Discover */}
                                                <button
                                                    onClick={() => setOpenMobileSection(s => s === 'discover' ? null : 'discover')}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg ${
                                                        activeSection === 'discover' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                                                    } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                                >
                                                    Discover
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMobileSection === 'discover' ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openMobileSection === 'discover' && (
                                                    <div className="ml-2 mb-1">
                                                        <Link href="/explore" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Compass className="w-4 h-4" />Explore</Link>
                                                        <Link href="/discover" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Search className="w-4 h-4" />Discover</Link>
                                                        <Link href="/companies" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Building2 className="w-4 h-4" />Companies</Link>
                                                        <Link href="/network" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Users className="w-4 h-4" />Network</Link>
                                                        <Link href="/guilds" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Users className="w-4 h-4" />Guilds</Link>
                                                        <Link href="/showcase" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Trophy className="w-4 h-4" />Showcase</Link>
                                                    </div>
                                                )}

                                                <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                                                {/* Workspace */}
                                                <button
                                                    onClick={() => setOpenMobileSection(s => s === 'workspace' ? null : 'workspace')}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg ${
                                                        activeSection === 'workspace' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                                                    } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                                >
                                                    Workspace
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMobileSection === 'workspace' ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openMobileSection === 'workspace' && (
                                                    <div className="ml-2 mb-1">
                                                        <Link href="/home" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><LayoutDashboard className="w-4 h-4" />Feed</Link>
                                                        <Link href="/tools" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Zap className="w-4 h-4" />Tools</Link>
                                                        <Link href="/analytics" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><BarChart3 className="w-4 h-4" />Analytics</Link>
                                                        <Link href="/ai-assistant" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Bot className="w-4 h-4" />AI Assistant</Link>
                                                    </div>
                                                )}

                                                <div className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                                                {/* Getting Started */}
                                                <button
                                                    onClick={() => setOpenMobileSection(s => s === 'getting-started' ? null : 'getting-started')}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg ${
                                                        activeSection === 'getting-started' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                                                    } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                                >
                                                    Getting Started
                                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openMobileSection === 'getting-started' ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openMobileSection === 'getting-started' && (
                                                    <div className="ml-2 mb-1">
                                                        <Link href="/start" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Rocket className="w-4 h-4" />Get Started</Link>
                                                        <Link href="/register" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><UserPlus className="w-4 h-4" />Register</Link>
                                                        <Link href="/onboarding" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Sparkles className="w-4 h-4" />Onboarding</Link>
                                                        <Link href="/share" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Share2 className="w-4 h-4" />Share Profile</Link>
                                                        <Link href="/verification/history" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><ClipboardCheck className="w-4 h-4" />Verification History</Link>
                                                        <Link href="/about" onClick={() => setProofileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Info className="w-4 h-4" />About</Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Link href="/home" className="flex flex-col">
                                <ProofileLogo size={32} showWordmark={true} />
                                {!isAccountUser && (
                                    <span className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ml-10">
                                        Proven digital professional identities.
                                    </span>
                                )}
                            </Link>
                        </div>

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

                                    <Link href="/opportunities" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        Opportunities
                                    </Link>

                                    <Link href="/companies" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                        Companies
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="relative" onMouseEnter={() => openNav('career')} onMouseLeave={closeNavWithDelay}>
                                        <button className={navBtnClass('career')}>
                                            Career
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                        </button>
                                        {activeNav === 'career' && (
                                            <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200" onMouseEnter={() => openNav('career')} onMouseLeave={closeNavWithDelay}>
                                                <div className="p-1.5">
                                                    <Link href="/opportunities" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-emerald-900/20"><Briefcase className="w-4 h-4" />Opportunities</Link>
                                                    <Link href="/verification" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><ShieldCheck className="w-4 h-4" />Verification</Link>
                                                    <Link href="/reputation" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Star className="w-4 h-4" />Ratings</Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative" onMouseEnter={() => openNav('discover')} onMouseLeave={closeNavWithDelay}>
                                        <button className={navBtnClass('discover')}>
                                            Discover
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                        </button>
                                        {activeNav === 'discover' && (
                                            <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200" onMouseEnter={() => openNav('discover')} onMouseLeave={closeNavWithDelay}>
                                                <div className="p-1.5">
                                                    <Link href="/explore" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Compass className="w-4 h-4" />Explore</Link>
                                                    <Link href="/discover" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Search className="w-4 h-4" />Discover</Link>
                                                    <Link href="/companies" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Building2 className="w-4 h-4" />Companies</Link>
                                                    <Link href="/network" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Users className="w-4 h-4" />Network</Link>
                                                    <Link href="/guilds" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Users className="w-4 h-4" />Guilds</Link>
                                                    <Link href="/showcase" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Trophy className="w-4 h-4" />Showcase</Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative" onMouseEnter={() => openNav('workspace')} onMouseLeave={closeNavWithDelay}>
                                        <button className={navBtnClass('workspace')}>
                                            Workspace
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                        </button>
                                        {activeNav === 'workspace' && (
                                            <div className="absolute top-full left-0 mt-1 w-56 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200" onMouseEnter={() => openNav('workspace')} onMouseLeave={closeNavWithDelay}>
                                                <div className="p-1.5">
                                                    <Link href="/home" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><LayoutDashboard className="w-4 h-4" />Feed</Link>
                                                    <Link href="/tools" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Zap className="w-4 h-4" />Tools</Link>
                                                    <Link href="/analytics" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><BarChart3 className="w-4 h-4" />Analytics</Link>
                                                    <Link href="/ai-assistant" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Bot className="w-4 h-4" />AI Assistant</Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative" onMouseEnter={() => openNav('getting-started')} onMouseLeave={closeNavWithDelay}>
                                        <button className={navBtnClass('getting-started')}>
                                            Getting Started
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                        </button>
                                        {activeNav === 'getting-started' && (
                                            <div className="absolute top-full left-0 mt-1 w-60 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl dark:border-gray-700 dark:bg-gray-800 z-[60] animate-in fade-in slide-in-from-top-2 duration-200" onMouseEnter={() => openNav('getting-started')} onMouseLeave={closeNavWithDelay}>
                                                <div className="p-1.5">
                                                    <Link href="/start" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Rocket className="w-4 h-4" />Get Started</Link>
                                                    <Link href="/register" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><UserPlus className="w-4 h-4" />Register</Link>
                                                    <Link href="/onboarding" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Sparkles className="w-4 h-4" />Onboarding</Link>
                                                    <Link href="/share" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Share2 className="w-4 h-4" />Share Profile</Link>
                                                    <Link href="/verification/history" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><ClipboardCheck className="w-4 h-4" />Verification History</Link>
                                                    <Link href="/about" onClick={() => setActiveNav(null)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/20"><Info className="w-4 h-4" />About</Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    onMouseEnter={() => {
                                        setProofileMenuOpen(false);
                                        openUserMenu();
                                    }}
                                    onMouseLeave={closeUserMenuWithDelay}
                                >
                                    <button
                                        onMouseEnter={openUserMenu}
                                        onFocus={openUserMenu}
                                        className="flex items-center gap-2 p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20">
                                            {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                        </div>
                                    </button>

                                    {userDropdownOpen && (
                                        <div
                                            className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]"
                                            onMouseEnter={openUserMenu}
                                            onMouseLeave={closeUserMenuWithDelay}
                                        >
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
                                    <Link href="/opportunities" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
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
