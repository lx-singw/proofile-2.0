"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * PageTransition - Smooth page transition animations
 * 
 * Features:
 * - Fade in on route change
 * - Respects prefers-reduced-motion
 * - Lightweight CSS-only implementation (no Framer Motion dependency)
 */
export default function PageTransition({ children, className = "" }: PageTransitionProps) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [currentChildren, setCurrentChildren] = useState(children);

    useEffect(() => {
        // Start fade out
        setIsVisible(false);

        // After fade out, update content and fade in
        const timeout = setTimeout(() => {
            setCurrentChildren(children);
            setIsVisible(true);
        }, 150);

        return () => clearTimeout(timeout);
    }, [pathname, children]);

    // Initial mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div
            className={`transition-all duration-300 ease-out motion-reduce:transition-none ${isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                } ${className}`}
        >
            {currentChildren}
        </div>
    );
}

/**
 * FadeIn - Simple fade in animation for elements
 */
export function FadeIn({
    children,
    delay = 0,
    duration = 300,
    className = ""
}: {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    return (
        <div
            className={`motion-reduce:transition-none ${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(8px)",
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/**
 * StaggerChildren - Stagger animation for lists
 */
export function StaggerChildren({
    children,
    staggerDelay = 50,
    className = ""
}: {
    children: React.ReactNode;
    staggerDelay?: number;
    className?: string;
}) {
    return (
        <div className={className}>
            {React.Children.map(children, (child, index) => (
                <FadeIn delay={index * staggerDelay}>
                    {child}
                </FadeIn>
            ))}
        </div>
    );
}

/**
 * SlideIn - Slide in from specified direction
 */
export function SlideIn({
    children,
    direction = "left",
    delay = 0,
    className = ""
}: {
    children: React.ReactNode;
    direction?: "left" | "right" | "top" | "bottom";
    delay?: number;
    className?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    const transforms = {
        left: isVisible ? "translateX(0)" : "translateX(-20px)",
        right: isVisible ? "translateX(0)" : "translateX(20px)",
        top: isVisible ? "translateY(0)" : "translateY(-20px)",
        bottom: isVisible ? "translateY(0)" : "translateY(20px)",
    };

    return (
        <div
            className={`motion-reduce:transition-none ${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: transforms[direction],
                transition: "opacity 300ms ease-out, transform 300ms ease-out",
            }}
        >
            {children}
        </div>
    );
}
