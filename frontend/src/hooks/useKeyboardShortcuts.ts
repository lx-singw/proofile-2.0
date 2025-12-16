"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
    key: string;
    description: string;
    action: () => void;
    modifier?: "ctrl" | "alt" | "shift" | "meta";
}

/**
 * useKeyboardShortcuts - Global keyboard shortcuts hook
 * 
 * Features:
 * - Two-key sequences (g + h for go home)
 * - Single key shortcuts (? for help)
 * - Modifier support (Ctrl, Alt, Shift)
 * - Automatically disabled in input fields
 */
export function useKeyboardShortcuts(onHelpOpen: () => void) {
    const router = useRouter();
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ignore if user is typing in an input
        const target = event.target as HTMLElement;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable
        ) {
            return;
        }

        const key = event.key.toLowerCase();

        // Handle Escape - close modals
        if (key === "escape") {
            setPendingKey(null);
            return;
        }

        // Handle ? for help
        if (key === "?" || (event.shiftKey && key === "/")) {
            event.preventDefault();
            onHelpOpen();
            return;
        }

        // Two-key sequences starting with 'g' (go to)
        if (pendingKey === "g") {
            event.preventDefault();
            setPendingKey(null);

            switch (key) {
                case "h":
                case "d":
                    router.push("/dashboard");
                    break;
                case "j":
                    router.push("/jobs");
                    break;
                case "p":
                    router.push("/profile");
                    break;
                case "v":
                    router.push("/verification");
                    break;
                case "r":
                    router.push("/reputation");
                    break;
                case "s":
                    router.push("/settings");
                    break;
                default:
                    break;
            }
            return;
        }

        // Start two-key sequence
        if (key === "g") {
            setPendingKey("g");
            // Clear pending after 1 second
            setTimeout(() => setPendingKey(null), 1000);
            return;
        }
    }, [pendingKey, router, onHelpOpen]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return { pendingKey };
}

// Shortcut definitions for display in help modal
export const SHORTCUTS = [
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Esc"], description: "Close modal / Cancel" },
    { keys: ["g", "h"], description: "Go to Dashboard" },
    { keys: ["g", "j"], description: "Go to Jobs" },
    { keys: ["g", "p"], description: "Go to Profile" },
    { keys: ["g", "v"], description: "Go to Verification" },
    { keys: ["g", "r"], description: "Go to Reputation" },
    { keys: ["g", "s"], description: "Go to Settings" },
];

export default useKeyboardShortcuts;
