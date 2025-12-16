import React from "react";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Jobs */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Jobs</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><Link href="/portal?filter=remote" className="hover:text-blue-600">Remote Jobs</Link></li>
                                <li><Link href="/portal?category=technology" className="hover:text-blue-600">Tech Jobs</Link></li>
                                <li><Link href="/portal?category=finance" className="hover:text-blue-600">Finance Jobs</Link></li>
                                <li><Link href="/portal?experience=entry" className="hover:text-blue-600">Entry Level</Link></li>
                            </ul>
                        </div>

                        {/* Locations */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Locations</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><Link href="/portal?location=johannesburg" className="hover:text-blue-600">Johannesburg</Link></li>
                                <li><Link href="/portal?location=cape-town" className="hover:text-blue-600">Cape Town</Link></li>
                                <li><Link href="/portal?location=durban" className="hover:text-blue-600">Durban</Link></li>
                                <li><Link href="/portal?location=pretoria" className="hover:text-blue-600">Pretoria</Link></li>
                            </ul>
                        </div>

                        {/* For Job Seekers */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">For Job Seekers</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><Link href="/register" className="hover:text-blue-600">Create Profile</Link></li>
                                <li><Link href="/resume/build" className="hover:text-blue-600">Build Resume</Link></li>
                                <li><Link href="/verification" className="hover:text-blue-600">Get Verified</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Proofile</h4>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li><Link href="/" className="hover:text-blue-600">About Us</Link></li>
                                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>© {new Date().getFullYear()} Proofile. All rights reserved.</p>
                        <p className="mt-1">Helping South Africans find verified opportunities.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
