export default function JobsLoading() {
    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-48" />
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-32" />
                    </div>

                    {/* Cards */}
                    <div className="lg:col-span-3 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-48" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
