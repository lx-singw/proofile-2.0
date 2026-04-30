'use client';

export function FeedCardSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-emerald-200/40 dark:border-emerald-800/20 overflow-hidden animate-pulse">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800" />

      <div className="p-5 space-y-4">
        {/* Header row: logo + company + title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        </div>

        {/* Location + salary */}
        <div className="flex gap-4">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>

        {/* Why you're seeing this */}
        <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 p-3 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/5" />
        </div>

        {/* Skill tags */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <div className="h-9 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function FeedCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}
