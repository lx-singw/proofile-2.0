import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-lg w-full text-center">
                {/* Illustration */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl w-full h-full flex items-center justify-center shadow-xl border border-gray-200 dark:border-gray-700">
                        <FileQuestion className="w-16 h-16 text-emerald-500" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Page Not Found
                </h1>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/home">
                        <Button size="lg" className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                            <Home className="w-5 h-5" />
                            Go Home
                        </Button>
                    </Link>
                    <Link href="javascript:history.back()">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
