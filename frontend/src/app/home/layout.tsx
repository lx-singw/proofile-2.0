"use client";

import React from "react";
import MobileNav from "@/components/layout/MobileNav";
import useAuth from "@/hooks/useAuth";

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();

    return (
        <>
            {children}
            {user && <MobileNav />}
        </>
    );
}
