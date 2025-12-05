/**
 * Skeleton Loader Components
 * Animated placeholders for loading states
 */

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
    );
}

export function SkeletonScore() {
    return (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
        </div>
    );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse"
                >
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonAnalysis() {
    return (
        <div className="space-y-6">
            {/* Score */}
            <SkeletonScore />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                ))}
            </div>

            {/* Content Cards */}
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}
