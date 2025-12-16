"use client";

import React from "react";
import { Plus } from "lucide-react";

interface CreateButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
}

/**
 * CreateButton
 * 
 * Primary action button (plus icon) for quick actions.
 * Features:
 * - Prominent blue styling
 * - Accessible (ARIA labels)
 * - Used in header for quick create menu
 */
export default function CreateButton({
  onClick,
  ariaLabel = "Create new",
}: CreateButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
      aria-label={ariaLabel}
      aria-haspopup="true"
    >
      <Plus className="w-5 h-5" />
    </button>
  );
}
