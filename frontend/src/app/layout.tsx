import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PersonalizationProvider } from "@/providers/PersonalizationProvider";
import { Toaster } from "sonner";
import AppShell from "@/components/layout/AppShell";
import { GlobalErrorBoundary } from "@/components/ui/GlobalErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "Proofile - Professional Resume Builder",
  description: "Build your professional resume in minutes with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PersonalizationProvider>
              <GlobalErrorBoundary>
                <AppShell>
                  {children}
                </AppShell>
              </GlobalErrorBoundary>
              <Toaster position="bottom-right" richColors />
            </PersonalizationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
