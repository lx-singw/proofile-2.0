"use client";

import Link from "next/link";
import { CheckCircle, Star, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { useReputationScores } from "@/hooks/useReputationScores";

// Components
import { Footer } from "@/components/layout/Footer";
import { UserProfileCard } from "@/components/home/UserProfileCard";
import HomeLeftSidebar from "@/components/home/HomeLeftSidebar";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !!user;

  // Reputation for userFeedState derivation (safe to call always — hook guards internally)
  const { reputation } = useReputationScores();
  const userFeedState: UserFeedState = !isLoggedIn
    ? 'anonymous'
    : (reputation?.total_reviews ?? 0) > 0
    ? 'verified'
    : 'profile';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-cyan-950/30 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Upgrade prompts */}
      {/* Hero Section (Gradient Banner) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 dark:from-emerald-700 dark:via-teal-800 dark:to-green-900 text-white py-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 animate-gradient-x" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm sm:text-base text-white font-medium drop-shadow-sm">
            For <span className="font-bold">students</span>, <span className="font-bold">graduates</span>, <span className="font-bold">professionals</span>, <span className="font-bold">job seekers</span>, <span className="font-bold">freelancers</span>, and <span className="font-bold">everyone</span> building their future — Proofile is your platform.
          </p>
        </div>
      </div>

      {/* ========================================= */}
      {/* LOGGED-IN VIEW: Professional Feed */}
      {/* ========================================= */}
      {isLoggedIn ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome back, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{user?.first_name || 'Professional'}</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your verified profile opens doors. Browse opportunities, grow your network, and build your reputation.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all hover:scale-105"
              >
                Browse Opportunities
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/network"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all hover:scale-105"
              >
                My Network
              </Link>
              <Link
                href={user?.username ? `/p/${user.username}` : '/profile'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105"
              >
                View Profile
              </Link>
            </div>
          </div>

          {/* Quick Stats / Dashboard Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{reputation?.global_score ?? '-'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Proofile Score</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-teal-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{reputation?.total_reviews ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reviews</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-cyan-500" />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">-</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
            </div>
          </div>

          {/* Sidebars below for logged-in users */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <UserProfileCard />
              <HomeLeftSidebar />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <HomeRightSidebar />
            </div>
          </div>
        </div>
      ) : (
        /* ========================================= */
        /* GUEST VIEW: Hero + Opportunities */
        /* ========================================= */
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-50/50 dark:from-gray-800 dark:via-emerald-950/30 dark:to-teal-950/30 py-10 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/25 to-purple-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-full text-sm font-medium border border-emerald-500/20 mb-4 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">Trusted by 10,000+ professionals</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">Find Your Next</span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Opportunity</span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                    Browse thousands of verified opportunities from South Africa's top employers. Build your verified profile for faster applications.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/start"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
                  >
                    <span className="relative flex items-center gap-2">
                      Create Free Profile
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-emerald-600 dark:text-emerald-400 font-semibold border-2 border-emerald-500/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all hover:scale-105 backdrop-blur-sm"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-600 dark:text-gray-400 mt-8">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Free to browse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>No commitment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Get verified</span>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Tiles for Guests */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/opportunities" className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <ArrowRight className="w-6 h-6 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Browse Opportunities</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Discover verified jobs and training programs.</p>
              </Link>
              <Link href="/start" className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-teal-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Get Verified</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Build a trusted professional profile.</p>
              </Link>
              <Link href="/network" className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-cyan-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explore Network</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect with top professionals.</p>
              </Link>
              <div className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Free Forever</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">No cost to browse and apply.</p>
              </div>
            </div>
          </div>

          {/* Verification Value Prop Section */}
          <section id="verification" className="relative py-20 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[120px] rounded-full translate-x-1/2" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" />
                    Multi-Layer Verification
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Beyond the Resume. <br />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Proven Identity.</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Proofile verifies your core professional credentials at the source. From email and phone to employment history and certifications, we build a trust layer that employers can rely on instantly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {[
                      { title: "Direct Verification", desc: "Automated checks with institutions" },
                      { title: "Immutable Record", desc: "Tamper-proof professional history" },
                      { title: "Trust Score", desc: "Dynamic score based on verified data" },
                      { title: "Enhanced Visibility", desc: "Verified users get 3x more views" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex-shrink-0 w-5 h-5 mt-1 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
                    <CheckCircle className="w-24 h-24 mb-6 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-2 uppercase tracking-widest">Verified</h3>
                    <p className="text-emerald-50 font-medium">98.5% Trust Accuracy Score</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ratings Value Prop Section */}
          <section id="ratings" className="relative py-20 bg-slate-50 dark:bg-gray-800/50 overflow-hidden border-y border-gray-200/50 dark:border-gray-700/50">
            <div className="absolute bottom-0 left-0 w-1/2 h-full bg-teal-500/5 blur-[120px] rounded-full -translate-x-1/2" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-400 font-semibold text-sm border border-teal-500/20">
                    <Star className="w-4 h-4 fill-current" />
                    Professional Reputation
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    Peer Endorsements That <br />
                    <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Actually Matter.</span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Static skills lists are a thing of the past. Proofile allows your managers, colleagues, and clients to provide verified ratings and endorsements on your specific contributions.
                  </p>
                  <Link href="/start" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-all">
                    Start Building Reputation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: "Technical Proficiency", score: 4.8 },
                    { label: "Collaboration", score: 4.9 },
                    { label: "Problem Solving", score: 4.7 },
                    { label: "Reliability", score: 5.0 }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
                        <Star className={`w-6 h-6 text-teal-500 ${i % 2 === 0 ? 'fill-teal-500' : ''}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1">{item.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{item.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <Footer />
    </>
  );
}
