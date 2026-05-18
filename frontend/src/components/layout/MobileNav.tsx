"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Briefcase,
    Users,
    User,
    Menu,
    Search
} from "lucide-react";

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

    const navItems = [
        {
            icon: Home,
            label: "Home",
            path: "/home"
        },
        {
            icon: Briefcase,
            label: "Jobs",
            path: "/opportunities"
        },
        {
            icon: Search,
            label: "Explore",
            path: "/companies"
        },
        {
            icon: Users,
            label: "Network",
            path: "/network"
        },
        {
            icon: User,
            label: "Profile",
            path: "/profile"
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800" />

            {/* Nav Container */}
            <nav className="relative flex justify-around items-center px-2 py-3 pb-safe">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 relative group ${active
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            aria-current={active ? "page" : undefined}
                        >
                            {/* Active Indicator Glow */}
                            {active && (
                                <div className="absolute -top-3 w-8 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-b-full shadow-[0_4px_12px_rgba(16,185,129,0.5)]" />
                            )}

                            <div className={`relative p-1.5 rounded-lg transition-all ${active ? "bg-emerald-100/50 dark:bg-emerald-900/20 translate-y-[-2px]" : ""
                                }`}>
                                <Icon className={`w-6 h-6 ${active ? "fill-current" : ""
                                    }`} />
                            </div>

                            <span className={`text-[10px] font-medium tracking-tight transition-all ${active ? "opacity-100 font-bold" : "opacity-70 group-hover:opacity-100"
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
