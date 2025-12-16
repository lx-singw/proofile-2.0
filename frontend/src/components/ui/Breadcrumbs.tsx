"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href: string;
}

// Route label mappings
const ROUTE_LABELS: Record<string, string> = {
    "": "Dashboard",
    "dashboard": "Dashboard",
    "jobs": "Jobs",
    "saved": "Saved Jobs",
    "agents": "AI Agents",
    "market": "Market Intel",
    "profile": "Profile",
    "edit": "Edit",
    "create": "Create",
    "verification": "Verification",
    "identity": "Identity",
    "history": "History",
    "reputation": "Reputation",
    "request": "Request Rating",
    "settings": "Settings",
    "resume": "Resume",
    "build": "Builder",
    "analytics": "Analytics",
    "ai-assistant": "AI Assistant",
    "feed": "Feed",
    "discover": "Discover",
    "explore": "Explore",
    "tools": "Tools",
    "share": "Share",
    "showcase": "Showcase",
};

function getLabel(segment: string): string {
    // Check if it's a dynamic segment (e.g., [id])
    if (segment.startsWith("[") || /^\d+$/.test(segment)) {
        return "Details";
    }
    return ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface BreadcrumbsProps {
    className?: string;
}

export default function Breadcrumbs({ className = "" }: BreadcrumbsProps) {
    const pathname = usePathname();

    // Split pathname into segments
    const segments = pathname.split("/").filter(Boolean);

    // Don't show breadcrumbs on home/dashboard
    if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
        return null;
    }

    // Build breadcrumb items
    const items: BreadcrumbItem[] = [
        { label: "Dashboard", href: "/dashboard" },
    ];

    let currentPath = "";
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        items.push({
            label: getLabel(segment),
            href: currentPath,
        });
    });

    return (
        <nav className={`flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 ${className}`} aria-label="Breadcrumb">
            {items.map((item, index) => (
                <React.Fragment key={item.href}>
                    {index === 0 ? (
                        <Link
                            href={item.href}
                            className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                    ) : index === items.length - 1 ? (
                        // Last item - not clickable
                        <span className="font-medium text-gray-900 dark:text-white">
                            {item.label}
                        </span>
                    ) : (
                        <Link
                            href={item.href}
                            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            {item.label}
                        </Link>
                    )}

                    {index < items.length - 1 && (
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
