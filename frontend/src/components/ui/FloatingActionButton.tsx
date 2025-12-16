"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";

interface FABAction {
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
    color?: string;
}

interface FloatingActionButtonProps {
    actions: FABAction[];
    mainIcon?: React.ReactNode;
    className?: string;
}

/**
 * FloatingActionButton - Mobile-friendly FAB with expandable menu
 * 
 * Features:
 * - Fixed bottom-right position
 * - Expandable action menu
 * - Auto-hide on scroll down, show on scroll up
 * - Touch-friendly sizing
 * - Only visible on mobile/tablet
 */
export default function FloatingActionButton({
    actions,
    mainIcon = <Plus className="w-6 h-6" />,
    className = "",
}: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        function handleScroll() {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down
                setIsVisible(false);
                setIsOpen(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Close on escape
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
        <>
            {/* Backdrop when open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80] lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* FAB Container - Only visible on mobile/tablet */}
            <div
                className={`fixed bottom-20 right-4 z-[90] lg:hidden transition-all duration-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                    } ${className}`}
            >
                {/* Action Buttons */}
                <div className={`flex flex-col-reverse items-center gap-3 mb-3 transition-all duration-200 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                    }`}>
                    {actions.map((action, index) => {
                        const button = (
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                                    {action.label}
                                </span>
                                <button
                                    onClick={() => {
                                        action.onClick?.();
                                        setIsOpen(false);
                                    }}
                                    className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 ${action.color || "bg-gray-700 text-white hover:bg-gray-600"
                                        }`}
                                    style={{
                                        transitionDelay: `${index * 50}ms`,
                                    }}
                                >
                                    {action.icon}
                                </button>
                            </div>
                        );

                        if (action.href) {
                            return (
                                <Link key={index} href={action.href} onClick={() => setIsOpen(false)}>
                                    {button}
                                </Link>
                            );
                        }

                        return <div key={index}>{button}</div>;
                    })}
                </div>

                {/* Main FAB Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 ${isOpen
                            ? "bg-gray-800 text-white rotate-45"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X className="w-6 h-6" /> : mainIcon}
                </button>
            </div>
        </>
    );
}

// Pre-built FAB configurations
export function JobsFAB({ onQuickApply }: { onQuickApply?: () => void }) {
    return (
        <FloatingActionButton
            actions={[
                {
                    icon: <span className="text-lg">⚡</span>,
                    label: "Quick Apply",
                    onClick: onQuickApply,
                    color: "bg-green-600 text-white hover:bg-green-700"
                },
                {
                    icon: <span className="text-lg">🔖</span>,
                    label: "Saved Jobs",
                    href: "/jobs/saved"
                },
            ]}
        />
    );
}

export function ProfileFAB({ onShare }: { onShare?: () => void }) {
    return (
        <FloatingActionButton
            actions={[
                {
                    icon: <span className="text-lg">✏️</span>,
                    label: "Edit Profile",
                    href: "/settings?tab=profile"
                },
                {
                    icon: <span className="text-lg">🔗</span>,
                    label: "Share",
                    onClick: onShare,
                    color: "bg-blue-600 text-white hover:bg-blue-700"
                },
            ]}
        />
    );
}

export function ReputationFAB({ onRequestRating }: { onRequestRating?: () => void }) {
    return (
        <FloatingActionButton
            actions={[
                {
                    icon: <span className="text-lg">⭐</span>,
                    label: "Request Rating",
                    onClick: onRequestRating,
                    color: "bg-yellow-500 text-white hover:bg-yellow-600"
                },
                {
                    icon: <span className="text-lg">👥</span>,
                    label: "Rate Someone",
                    href: "/reputation/request"
                },
            ]}
        />
    );
}
