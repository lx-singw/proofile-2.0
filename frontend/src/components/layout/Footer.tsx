"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-400 py-12 mt-8 overflow-hidden">
            {/* Top Gradient Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    {/* Brand & Mission */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Proofile
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Empowering South Africans with verified profiles and AI-matched career opportunities.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-bold text-gray-200 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/home" className="hover:text-emerald-400 transition-colors">Home</Link></li>
                            <li><Link href="/opportunities" className="hover:text-emerald-400 transition-colors">Opportunities</Link></li>
                            <li><Link href="/verification" className="hover:text-emerald-400 transition-colors">Verification Center</Link></li>
                            <li><Link href="/tools" className="hover:text-emerald-400 transition-colors">Career Tools</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-bold text-gray-200 mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className="font-bold text-gray-200 mb-4">Connect</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">X (Twitter)</Link></li>
                            <li><Link href="#" className="hover:text-emerald-400 transition-colors">LinkedIn</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p>© {new Date().getFullYear()} Proofile. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
                        <Link href="/security" className="hover:text-emerald-400 transition-colors">Security</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
