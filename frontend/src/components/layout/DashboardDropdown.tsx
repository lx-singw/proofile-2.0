"use client";

import React, { useRef, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface DashboardDropdownItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  divider?: boolean;
  isDropdown?: boolean;
  items?: DashboardDropdownItem[];
}

interface DashboardDropdownProps {
  trigger: React.ReactNode;
  items: DashboardDropdownItem[];
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  onItemClick?: (item: DashboardDropdownItem, event?: React.MouseEvent) => void;
}

/**
 * DashboardDropdown
 * 
 * Reusable dropdown component for navigation menus.
 * Features:
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Click outside to close
 * - Accessible (ARIA labels, role attributes)
 * - Mobile-friendly
 */
export default function DashboardDropdown({
  trigger,
  items,
  align = "left",
  className = "",
  triggerClassName,
  onItemClick,
}: DashboardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      // Focus trap: Tab/Shift+Tab cycles through menu items only
      if (event.key === "Tab") {
        event.preventDefault();
        let nextIndex = highlightedIndex;
        if (event.shiftKey) {
          nextIndex = highlightedIndex > 0 ? highlightedIndex - 1 : items.length - 1;
        } else {
          nextIndex = highlightedIndex < items.length - 1 ? highlightedIndex + 1 : 0;
        }
        setHighlightedIndex(nextIndex);
        itemRefs.current[nextIndex]?.focus();
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev < items.length - 1 ? prev + 1 : 0;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : items.length - 1;
            itemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && items[highlightedIndex]) {
            const item = items[highlightedIndex];
            onItemClick?.(item);
            if (item.href) {
              window.location.href = item.href;
            }
            setIsOpen(false);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        default:
          break;
      }
    }

    // Trap focus inside dropdown
    function handleFocus(event: FocusEvent) {
      if (!isOpen) return;
      const menuItems = itemRefs.current.filter(Boolean);
      if (menuItems.length === 0) return;
      if (!menuItems.includes(event.target as HTMLAnchorElement)) {
        menuItems[highlightedIndex || 0]?.focus();
      }
    }

    // Return focus to trigger on close
    function handleClose() {
      if (!isOpen) {
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      dropdownRef.current?.addEventListener("focusin", handleFocus);
      dropdownRef.current?.addEventListener("transitionend", handleClose);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        dropdownRef.current?.removeEventListener("focusin", handleFocus);
        dropdownRef.current?.removeEventListener("transitionend", handleClose);
      };
    }
  }, [isOpen, highlightedIndex, items, onItemClick]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(0);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button (always <button> for accessibility) */}
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        className={triggerClassName || "inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"}
        aria-label="Open menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        {trigger}
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${align === "right" ? "right-0" : "left-0"
          } transform transition-all duration-200 origin-top ${isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        role="menu"
        aria-activedescendant={highlightedIndex >= 0 ? `dropdown-item-${highlightedIndex}` : undefined}
      >
        <div className="py-1">
          {items.map((item, index) => {
            // Check for active state (exact match or nested route)
            const isActive = item.href && (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)));

            // Handle nested dropdown items (like "More" menu)
            if (item.isDropdown && item.items) {
              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  {item.divider && (
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  )}
                  <div className="relative group">
                    <button
                      className={`w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-2`}
                      aria-haspopup="true"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                        <span>{item.label}</span>
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {/* Nested submenu */}
                    <div className="absolute left-full top-0 ml-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        {item.items.map((subItem, subIndex) => {
                          const isSubActive = subItem.href && (pathname === subItem.href || pathname?.startsWith(subItem.href));
                          return (
                            <React.Fragment key={`${subItem.label}-${subIndex}`}>
                              {subItem.divider && (
                                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                              )}
                              <a
                                href={subItem.href}
                                className={`block px-4 py-2 text-sm ${isSubActive
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                  } transition-colors flex items-center gap-2`}
                                role="menuitem"
                              >
                                {subItem.icon && <span className="w-4 h-4">{subItem.icon}</span>}
                                <span>{subItem.label}</span>
                              </a>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
                <a
                  id={`dropdown-item-${index}`}
                  ref={el => { itemRefs.current[index] = el; }}
                  href={item.href}
                  className={`block px-4 py-2 text-sm ${highlightedIndex === index || isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    } transition-colors flex items-center gap-2`}
                  role="menuitem"
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onFocus={() => setHighlightedIndex(index)}
                  onClick={(e) => {
                    onItemClick?.(item, e);
                    if (!e.defaultPrevented) {
                      setIsOpen(false);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onItemClick?.(item);
                      setIsOpen(false);
                      if (item.href) {
                        window.location.href = item.href;
                      }
                    }
                  }}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
