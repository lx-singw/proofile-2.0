"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Shield, Users } from "lucide-react";

interface Node {
    id: string;
    label: string;
    score: number;
    type: "user" | "verified_rater" | "peer";
    distance: number;
    angle: number;
}

interface ReputationConstellationProps {
    globalScore: number;
    connections?: any[];
}

export default function ReputationConstellation({ globalScore, connections = [] }: ReputationConstellationProps) {
    // Generate some interesting nodes if connections are empty for visual impact
    const nodes: Node[] = connections.length > 0 ? connections.map((c, i) => ({
        id: c.id,
        label: c.name,
        score: c.score,
        type: c.is_verified ? "verified_rater" : "peer",
        distance: 100 - (c.weight * 40), // closer if higher weight
        angle: (i * (360 / connections.length)) * (Math.PI / 180)
    })) : [
        { id: "1", label: "Manager", score: 4.9, type: "verified_rater", distance: 80, angle: 45 * (Math.PI / 180) },
        { id: "2", label: "Peer", score: 4.5, type: "peer", distance: 120, angle: 135 * (Math.PI / 180) },
        { id: "3", label: "Client", score: 5.0, type: "verified_rater", distance: 90, angle: 225 * (Math.PI / 180) },
        { id: "4", label: "Colleague", score: 4.2, type: "peer", distance: 110, angle: 315 * (Math.PI / 180) },
    ];

    const centerSize = 80;
    const canvasSize = 300;
    const center = canvasSize / 2;

    return (
        <div className="relative flex items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner overflow-hidden" style={{ width: canvasSize, height: canvasSize }}>
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-900/10 dark:to-teal-900/10 animate-pulse" />

            {/* Orbital Rings */}
            <div className="absolute w-[160px] h-[160px] border border-emerald-500/10 dark:border-emerald-500/5 rounded-full" />
            <div className="absolute w-[240px] h-[240px] border border-emerald-500/5 dark:border-emerald-500/10 rounded-full" />

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {nodes.map((node) => {
                    const x = center + Math.cos(node.angle) * node.distance;
                    const y = center + Math.sin(node.angle) * node.distance;
                    return (
                        <motion.line
                            key={`line-${node.id}`}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-emerald-500/20 dark:text-emerald-500/10"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                    );
                })}
            </svg>

            {/* Orbiting Nodes */}
            {nodes.map((node) => {
                const x = center + Math.cos(node.angle) * node.distance;
                const y = center + Math.sin(node.angle) * node.distance;

                return (
                    <motion.div
                        key={node.id}
                        className="absolute z-10"
                        initial={{ scale: 0, x: center, y: center }}
                        animate={{
                            scale: 1,
                            x: x - 12, // offset by radius
                            y: y - 12
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 10,
                            delay: 0.2 + parseInt(node.id) * 0.1
                        }}
                    >
                        <div className={`p-1.5 rounded-full shadow-lg ${node.type === "verified_rater"
                                ? "bg-emerald-500 text-white"
                                : "bg-white dark:bg-gray-800 text-emerald-500 border border-emerald-200 dark:border-emerald-700"
                            }`}>
                            {node.type === "verified_rater" ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        </div>

                        <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-1.5 py-0.5 rounded shadow-sm">
                                {node.label}
                            </span>
                        </div>
                    </motion.div>
                );
            })}

            {/* Central Node */}
            <motion.div
                className="relative z-20 flex flex-col items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-xl shadow-emerald-500/20 ring-4 ring-white dark:ring-gray-800">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                            {globalScore}
                        </span>
                        <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-2 h-2 ${s <= Math.round(globalScore) ? "text-amber-400 fill-current" : "text-gray-300"}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
