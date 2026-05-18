"use client";

import { Bookmark, Eye, ThumbsUp } from "lucide-react";

interface SocialProofProps {
  views?: number;
  saves?: number;
  vouches?: number;
}

export function SocialProof({ views, saves, vouches }: SocialProofProps) {
  const hasData = views || saves || vouches;
  
  if (!hasData) return null;

  return (
    <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      {views !== undefined && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Eye size={16} className="text-blue-500" />
          <span>{views} views</span>
        </div>
      )}
      {saves !== undefined && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Bookmark size={16} className="text-emerald-500" />
          <span>{saves} saves</span>
        </div>
      )}
      {vouches !== undefined && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ThumbsUp size={16} className="text-emerald-500" />
          <span>{vouches} vouches</span>
        </div>
      )}
    </div>
  );
}
