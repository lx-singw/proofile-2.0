"use client";

import { AlertTriangle, Bookmark, ExternalLink, Globe, Share2, Zap } from "lucide-react";

interface QuickActionsProps {
  opportunity: {
    canonical_link?: string;
    application_url?: string;
    contact_website?: string;
    source_url?: string;
  };
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onApply?: () => void;
}

export function QuickActions({ opportunity, isSaved, onSave, onShare, onApply }: QuickActionsProps) {
  const applyUrl = opportunity.canonical_link || opportunity.application_url;
  const companyWebsite = opportunity.contact_website;
  const hasDirectApplyLink = !!applyUrl;

  return (
    <div className="bg-gradient-to-br from-emerald-500/5 to-white dark:to-gray-800 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Actions</h3>
      </div>
      
      <div className="space-y-3">
        {hasDirectApplyLink ? (
          <button 
            onClick={onApply}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Apply Now
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">No direct application link available</p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                    Visit the company website or source page to apply directly.
                  </p>
                </div>
              </div>
            </div>
            
            {companyWebsite && (
              <button 
                onClick={() => window.open(companyWebsite, '_blank')}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Globe size={16} />
                Visit Company Website
              </button>
            )}
            
            <button 
              onClick={() => window.open(opportunity.source_url, '_blank')}
              className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              View Original Posting
            </button>
          </div>
        )}
        
        <button 
          onClick={onSave}
          className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
            isSaved 
              ? 'bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400' 
              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        
        <button 
          onClick={onShare}
          className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <Share2 size={16} />
          Share
        </button>
        
        <button 
          className="w-full py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <AlertTriangle size={16} />
          Report Issue
        </button>
      </div>
    </div>
  );
}
