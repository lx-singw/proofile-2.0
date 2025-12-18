"use client";

import React from "react";
import CandidateEarnings from "@/components/settings/CandidateEarnings";
import { HomeHeader } from "@/components/home/HomeHeader";
import { FadeIn } from "@/components/ui/PageTransition";
import { Wallet, Shield, History, Info } from "lucide-react";

export default function PaymentsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <HomeHeader />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <FadeIn>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments & Wallet</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your earnings, payouts, and payment methods.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <CandidateEarnings />

                            {/* Transaction History Placeholder */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-gray-400" />
                                        Recent Transactions
                                    </h3>
                                    <button className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                                        View All
                                    </button>
                                </div>
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions yet. Your earnings will appear here.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
                                <Shield className="w-8 h-8 mb-4 opacity-80" />
                                <h3 className="font-bold text-lg mb-2">Secure & Private</h3>
                                <p className="text-emerald-50 text-sm leading-relaxed">
                                    Proofile uses Stripe for all financial transactions. We never store your credit card details or bank information on our servers.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Info className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Help & FAQ</h3>
                                </div>
                                <ul className="space-y-3 text-sm">
                                    <li>
                                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors">How do payouts work?</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors">What are platform fees?</a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors">Changing payout currency</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </main>
        </div>
    );
}
