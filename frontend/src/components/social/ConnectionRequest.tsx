"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserPlus, Check, X, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConnectionStatus = "none" | "pending" | "connected" | "received";

interface ConnectionButtonProps {
    status: ConnectionStatus;
    onConnect: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onMessage?: () => void;
    size?: "sm" | "md";
}

export function ConnectionButton({
    status,
    onConnect,
    onAccept,
    onReject,
    onMessage,
    size = "md",
}: ConnectionButtonProps) {
    const sizeClasses = size === "sm" ? "text-sm px-3 py-1.5" : "px-4 py-2";

    switch (status) {
        case "connected":
            return (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onMessage}
                        className={`rounded-xl border-gray-200 dark:border-gray-700 ${sizeClasses}`}
                    >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Message
                    </Button>
                </div>
            );

        case "pending":
            return (
                <Button
                    variant="outline"
                    disabled
                    className={`rounded-xl border-gray-200 dark:border-gray-700 text-gray-500 ${sizeClasses}`}
                >
                    <Clock className="w-4 h-4 mr-1.5" />
                    Pending
                </Button>
            );

        case "received":
            return (
                <div className="flex gap-2">
                    <Button
                        onClick={onAccept}
                        className={`rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white ${sizeClasses}`}
                    >
                        <Check className="w-4 h-4 mr-1.5" />
                        Accept
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onReject}
                        className={`rounded-xl border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 ${sizeClasses}`}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            );

        default:
            return (
                <Button
                    onClick={onConnect}
                    className={`rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ${sizeClasses}`}
                >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Connect
                </Button>
            );
    }
}

interface ConnectionRequest {
    id: string;
    user: {
        id: number;
        name: string;
        headline?: string;
        avatar_url?: string;
        username?: string;
    };
    message?: string;
    created_at: string;
}

interface ConnectionRequestCardProps {
    request: ConnectionRequest;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export function ConnectionRequestCard({ request, onAccept, onReject }: ConnectionRequestCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
                {request.user.avatar_url ? (
                    <Image
                        src={request.user.avatar_url}
                        alt={request.user.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                        {request.user.name.charAt(0)}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {request.user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {request.user.headline || "Proofile User"}
                    </p>
                    {request.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                            "{request.message}"
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <Button
                    onClick={() => onAccept(request.id)}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                    Accept
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onReject(request.id)}
                    className="flex-1 rounded-lg border-gray-200 dark:border-gray-700 text-sm"
                >
                    Ignore
                </Button>
            </div>
        </div>
    );
}

interface ConnectionRequestsListProps {
    requests: ConnectionRequest[];
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export function ConnectionRequestsList({ requests, onAccept, onReject }: ConnectionRequestsListProps) {
    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending connection requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <ConnectionRequestCard
                    key={request.id}
                    request={request}
                    onAccept={onAccept}
                    onReject={onReject}
                />
            ))}
        </div>
    );
}
