import { FileText, User, Star, Shield, Flame, TrendingUp, Trophy, Building2, DollarSign, LayoutDashboard, Settings, LogOut, Upload } from "lucide-react";

export const LEFT_MENU_ITEMS = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Resume Builder", href: "/resume/build", icon: <FileText className="w-4 h-4" /> },
  { label: "Upload Resume", href: "/resume/upload", icon: <Upload className="w-4 h-4" /> },
  { label: "Verification", href: "/verification", icon: <Shield className="w-4 h-4" /> },
  { label: "Peer Ratings", href: "/ratings", icon: <Star className="w-4 h-4" /> },
  { label: "AI Matching", href: "/ai-matching", icon: <FileText className="w-4 h-4" /> },
  { label: "Trending Jobs", href: "/jobs/trending", icon: <Flame className="w-4 h-4" /> },
  { label: "Live Activity", href: "/activity/live", icon: <TrendingUp className="w-4 h-4" /> },
  { label: "Skills Leaderboard", href: "/skills/leaderboard", icon: <Trophy className="w-4 h-4" /> },
  { label: "Companies Hiring", href: "/companies/hiring", icon: <Building2 className="w-4 h-4" /> },
  { label: "Salary Insights", href: "/salary/insights", icon: <DollarSign className="w-4 h-4" /> },
  { label: "Browse Talent", href: "/talent", icon: <User className="w-4 h-4" /> },
  { label: "Pricing", href: "/pricing", icon: <DollarSign className="w-4 h-4" /> },
  { label: "Blog", href: "/blog", icon: <FileText className="w-4 h-4" /> },
  { label: "Documentation", href: "/docs", icon: <FileText className="w-4 h-4" /> },
  { label: "Help Center", href: "/help", icon: <FileText className="w-4 h-4" /> },
];

export const RIGHT_MENU_ITEMS = [
  { label: "My Profile", href: "/profile", icon: <User className="w-4 h-4" /> },
  { label: "My Ratings", href: "/ratings", icon: <Star className="w-4 h-4" /> },
  { label: "My Verification", href: "/verification", icon: <Shield className="w-4 h-4" /> },
  { label: "Saved Jobs", href: "/jobs/saved", icon: <Flame className="w-4 h-4" /> },
  { label: "Download PDF", href: "/resume/download", icon: <FileText className="w-4 h-4" /> },
  { label: "Share Profile", href: "/profile/share", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Account Settings", href: "/settings", icon: <Settings className="w-4 h-4" />, divider: true },
  { label: "Sign Out", href: "/logout", icon: <LogOut className="w-4 h-4" /> },
];
