'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';

type GuestTab = 'for-you' | 'browse';
type AuthTab = 'for-you' | 'activity';

interface HomeFeedTabsProps {
  /** Whether the user is logged in — controls tab labels */
  isLoggedIn: boolean;
  /** Content to render in the "For You" tab */
  forYouContent: ReactNode;
  /** Content to render in the "Browse" (guest) or "Activity" (logged-in) tab */
  secondaryContent: ReactNode;
  /** Optional className on the wrapper div */
  className?: string;
}

const SESSION_KEY = 'pf_home_active_tab';

export function HomeFeedTabs({
  isLoggedIn,
  forYouContent,
  secondaryContent,
  className = '',
}: HomeFeedTabsProps) {
  const secondaryLabel = isLoggedIn ? 'Activity' : 'Browse';
  const secondaryId: GuestTab | AuthTab = isLoggedIn ? 'activity' : 'browse';

  const [activeTab, setActiveTab] = useState<string>('for-you');

  // Restore last active tab from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved === 'for-you' || saved === secondaryId) {
        setActiveTab(saved);
      }
    } catch {
      // sessionStorage unavailable (e.g., private browsing edge cases)
    }
  }, [secondaryId]);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      try {
        sessionStorage.setItem(SESSION_KEY, tab);
      } catch {
        // ignore
      }
    },
    [],
  );

  return (
    <div className={`flex flex-col gap-0 ${className}`}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-700/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/30 mb-4">
        <TabButton
          id="for-you"
          label="For You"
          active={activeTab === 'for-you'}
          onClick={handleTabChange}
        />
        <TabButton
          id={secondaryId}
          label={secondaryLabel}
          active={activeTab === secondaryId}
          onClick={handleTabChange}
        />
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'for-you' ? forYouContent : secondaryContent}
      </div>
    </div>
  );
}

function TabButton({
  id,
  label,
  active,
  onClick,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 ${
        active
          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {active ? (
        <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent font-bold">
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
