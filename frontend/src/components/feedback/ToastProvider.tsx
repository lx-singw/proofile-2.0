"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Toast notification provider using Sonner
 * Already integrated with theme system for dark mode support
 */
export default function ToastProvider() {
    const { theme } = useTheme();

    return (
        <Toaster
            position="top-right"
            theme={theme as "light" | "dark"}
            richColors
            expand={true}
            duration={4000}
            toastOptions={{
                className: "font-sans",
                style: {
                    borderRadius: "12px",
                },
            }}
        />
    );
}
