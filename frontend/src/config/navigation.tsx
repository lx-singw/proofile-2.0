import {
  FileText, User, Star, Shield, Flame, TrendingUp, Trophy, Building2,
  DollarSign, LayoutDashboard, Settings, LogOut, Upload, Search,
  Briefcase, Zap, PenTool, BarChart3, Compass, Bot, MoreHorizontal
} from "lucide-react";

/**
 * PRIMARY NAVIGATION
 * 
 * Main nav items: Home, Verification, Ratings, Jobs & AI Agents, More
 */
export const PRIMARY_NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Verification", href: "/dashboard/verification", icon: <Shield className="w-4 h-4" /> },
  { label: "Ratings", href: "/reputation", icon: <Star className="w-4 h-4" /> },
  { label: "Job Matching & AI Agents", href: "/jobs", icon: <Briefcase className="w-4 h-4" /> },
];

/**
 * SECONDARY NAVIGATION (in "More" dropdown)
 * 
 * Advanced features hidden until needed.
 */
export const SECONDARY_NAV_ITEMS = [
  { label: "Feed", href: "/feed", icon: <TrendingUp className="w-4 h-4" /> },
  { label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" /> },
  { label: "Explore", href: "/explore", icon: <Compass className="w-4 h-4" /> },
  { label: "Discover", href: "/discover", icon: <Search className="w-4 h-4" />, divider: true },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" />, divider: true },
  { label: "Career Tools", href: "/tools", icon: <PenTool className="w-4 h-4" /> },
];


/**
 * LEFT_MENU_ITEMS - Full nav with More dropdown
 */
export const LEFT_MENU_ITEMS = [
  ...PRIMARY_NAV_ITEMS,
  { label: "More", icon: <MoreHorizontal className="w-4 h-4" />, isDropdown: true, items: SECONDARY_NAV_ITEMS },
];

/**
 * RIGHT_MENU_ITEMS - User dropdown menu
 * 
 * Profile moved here, above View Public Profile
 */
export const RIGHT_MENU_ITEMS = [
  { label: "Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
  { label: "View Public Profile", href: "/p/me", icon: <User className="w-4 h-4" /> },
  { label: "Account Settings", href: "/settings", icon: <Settings className="w-4 h-4" />, divider: true },
  { label: "Sign Out", href: "/logout", icon: <LogOut className="w-4 h-4" /> },
];
