"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";

interface LivenessCheckProps {
    onCapture: (imageData: string) => void;
    onError?: (error: string) => void;
}

type CheckState = "initializing" | "ready" | "detecting" | "success" | "error";

export default function LivenessCheck({ onCapture, onError }: LivenessCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, setState] = useState<CheckState>("initializing");
    const [instruction, setInstruction] = useState<string>("Initializing camera...");
    const [stream, setStream] = useState<MediaStream | null>(null);

    const initCamera = useCallback(async () => {
        try {
            setState("initializing");
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setState("ready");
            setInstruction("Position your face in the oval and hold still");
        } catch (err) {
            setState("error");
            setInstruction("Camera access denied");
            onError?.("Unable to access camera. Please grant permission.");
        }
    }, [onError]);

    useEffect(() => {
        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [initCamera]);

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setState("detecting");
        setInstruction("Verifying liveness...");

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror the image (selfie mode)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg", 0.9);

        // Simulate liveness detection (in production, send to backend)
        setTimeout(() => {
            setState("success");
            setInstruction("Liveness verified!");
            onCapture(imageData);
        }, 1500);
    };

    const retry = () => {
        setState("ready");
        setInstruction("Position your face in the oval and hold still");
    };

    return (
        <div className="relative max-w-md mx-auto">
            {/* Video container with oval mask */}
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Oval overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
                        {/* Dark overlay with oval cutout */}
                        <defs>
                            <mask id="oval-mask">
                                <rect width="100%" height="100%" fill="white" />
                                <ellipse cx="150" cy="180" rx="100" ry="130" fill="black" />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#oval-mask)" />

                        {/* Oval border */}
                        <ellipse
                            cx="150"
                            cy="180"
                            rx="100"
                            ry="130"
                            fill="none"
                            stroke={state === "success" ? "#10b981" : state === "error" ? "#ef4444" : "#ffffff"}
                            strokeWidth="3"
                            strokeDasharray={state === "detecting" ? "10 5" : "none"}
                            className={state === "detecting" ? "animate-pulse" : ""}
                        />
                    </svg>
                </div>

                {/* State overlays */}
                {state === "initializing" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                )}

                {state === "success" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/50">
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                    </div>
                )}

                {state === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                        <AlertCircle className="w-16 h-16 text-red-400" />
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
                <p className={`text-sm font-medium ${state === "success" ? "text-emerald-600" :
                        state === "error" ? "text-red-600" :
                            "text-slate-600 dark:text-slate-400"
                    }`}>
                    {instruction}
                </p>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex justify-center gap-3">
                {state === "ready" && (
                    <button
                        onClick={captureImage}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                        Capture
                    </button>
                )}

                {state === "error" && (
                    <button
                        onClick={initCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}
