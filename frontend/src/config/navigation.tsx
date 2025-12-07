import {
  FileText, User, Star, Shield, Flame, TrendingUp, Trophy, Building2,
  DollarSign, LayoutDashboard, Settings, LogOut, Upload, Search,
  Briefcase, Zap, PenTool, BarChart3, Compass, Bot
} from "lucide-react";

export const LEFT_MENU_ITEMS = [
  // Core Platform
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
  { label: "Jobs", href: "/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Explore", href: "/explore", icon: <Compass className="w-4 h-4" /> },
  { label: "Discover", href: "/discover", icon: <Search className="w-4 h-4" /> },

  // AI & Ecosystem
  { label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" />, divider: true },
  { label: "Verification", href: "/verification", icon: <Shield className="w-4 h-4" /> },
  { label: "Reputation", href: "/reputation", icon: <Star className="w-4 h-4" /> },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },

  // Resume Tools (Secondary)
  { label: "Resumes", href: "/resume", icon: <FileText className="w-4 h-4" />, divider: true },
  { label: "Builder", href: "/resume/build", icon: <PenTool className="w-4 h-4" /> },
  { label: "AI Build", href: "/resume/ai-build", icon: <Zap className="w-4 h-4" /> },
];

export const RIGHT_MENU_ITEMS = [
  { label: "View Public Profile", href: "/p/me", icon: <User className="w-4 h-4" /> },
  { label: "Account Settings", href: "/settings", icon: <Settings className="w-4 h-4" />, divider: true },
  { label: "Sign Out", href: "/logout", icon: <LogOut className="w-4 h-4" /> },
];
