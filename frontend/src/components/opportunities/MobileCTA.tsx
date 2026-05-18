"use client";

import { Bookmark, ExternalLink, Globe, Zap } from "lucide-react";

interface MobileCTAProps {
  opportunity: {
    canonical_link?: string;
    application_url?: string;
    contact_website?: string;
    source_url?: string;
  };
  isSaved: boolean;
  onSave: () => void;
  onApply: () => void;
}

export function MobileCTA({ opportunity, isSaved, onSave, onApply }: MobileCTAProps) {
  const applyUrl = opportunity.canonical_link || opportunity.application_url;
  const companyWebsite = opportunity.contact_website;

  const getButtonContent = () => {
    if (applyUrl) {
      return (
        <>
          Apply Now <Zap size={18} />
        </>
      );
    } else if (companyWebsite) {
      return (
        <>
          Visit Website <Globe size={18} />
        </>
      );
    } else {
      return (
        <>
          View Posting <ExternalLink size={18} />
        </>
      );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 lg:hidden z-40">
      <div className="flex items-center gap-3 max-w-6xl mx-auto">
        <button 
          onClick={onSave}
          className={`p-3 rounded-full transition-colors ${
            isSaved 
              ? 'text-emerald-600 bg-emerald-500/10' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Bookmark size={22} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button 
          onClick={onApply}
          className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 text-white font-bold text-base flex items-center justify-center gap-2"
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  );
}
