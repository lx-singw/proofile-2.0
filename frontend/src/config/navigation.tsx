import {
  FileText, User, Star, Shield, Flame, TrendingUp, Trophy, Building2,
  DollarSign, LayoutDashboard, Settings, LogOut, Upload, Search,
  Briefcase, Zap, PenTool, BarChart3, Compass, Bot, MoreHorizontal
} from "lucide-react";

/**
 * PRIMARY NAVIGATION
 * 
 * Following "Don't Make Me Think" principles:
 * - Only 3 items visible at all times
 * - Clear, self-explanatory labels
 * - Everything else is progressive disclosure
 */
export const PRIMARY_NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Jobs", href: "/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
];

/**
 * SECONDARY NAVIGATION (in "More" dropdown)
 * 
 * Advanced features hidden until needed.
 * Reduces cognitive load for new users.
 */
export const SECONDARY_NAV_ITEMS = [
  { label: "Feed", href: "/feed", icon: <TrendingUp className="w-4 h-4" /> },
  { label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" /> },
  { label: "Explore", href: "/explore", icon: <Compass className="w-4 h-4" /> },
  { label: "Discover", href: "/discover", icon: <Search className="w-4 h-4" />, divider: true },
  { label: "Verification", href: "/verification", icon: <Shield className="w-4 h-4" /> },
  { label: "Reputation", href: "/reputation", icon: <Star className="w-4 h-4" /> },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" />, divider: true },
  { label: "Resumes", href: "/resume", icon: <FileText className="w-4 h-4" /> },
  { label: "Builder", href: "/resume/build", icon: <PenTool className="w-4 h-4" /> },
  { label: "AI Build", href: "/resume/ai-build", icon: <Zap className="w-4 h-4" /> },
];

/**
 * @deprecated Use PRIMARY_NAV_ITEMS instead.
 * Kept for backward compatibility during migration.
 */
export const LEFT_MENU_ITEMS = [
  ...PRIMARY_NAV_ITEMS,
  { label: "More", icon: <MoreHorizontal className="w-4 h-4" />, isDropdown: true, items: SECONDARY_NAV_ITEMS },
];

export const RIGHT_MENU_ITEMS = [
  { label: "View Public Profile", href: "/p/me", icon: <User className="w-4 h-4" /> },
  { label: "Account Settings", href: "/settings", icon: <Settings className="w-4 h-4" />, divider: true },
  { label: "Sign Out", href: "/logout", icon: <LogOut className="w-4 h-4" /> },
];
