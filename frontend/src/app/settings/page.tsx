"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock,
  Mail,
  Smartphone,
  Briefcase,
  Award,
  CheckCircle,
  Camera,
  Globe,
  Eye,
  EyeOff,
  ChevronRight,
  Settings2,
  Link as LinkIcon,
  CreditCard,
  Zap,
  Activity,
  Github,
  Linkedin,
  Twitter,
  Download,
  Trash2,
  Key,
  Clock,
  Laptop,
  LogOut,
  AlertTriangle,
  Star,
  Crown,
  Sparkles,
  FileText,
  HelpCircle,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import { VerificationModal } from "@/components/verification/VerificationModal";
import verificationService, { VerificationSummary } from "@/services/verificationService";
import QuickStatsBar from "@/components/ui/QuickStatsBar";
import { FadeIn } from "@/components/ui/PageTransition";
import PersonalizationSettings from "@/components/settings/PersonalizationSettings";

// Schema for account settings
const accountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().max(120, "Keep it under 120 characters"),
  current_password: z.string().optional(),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/(?=.*[a-z])/, "Include a lowercase letter")
    .regex(/(?=.*[A-Z])/, "Include an uppercase letter")
    .regex(/(?=.*\d)/, "Include a number")
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>_+-])/, "Include a special character")
    .optional()
    .or(z.literal("")),
});

// Schema for profile settings
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be under 30 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  profile_visibility: z.enum(["public", "private"]),
});

type AccountFormValues = z.infer<typeof accountSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;

type TabId = "account" | "profile" | "privacy" | "verification" | "notifications" | "preferences" | "personalization" | "connected" | "billing" | "integrations" | "activity";

const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "account", label: "Account", icon: <User className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <Settings2 className="w-4 h-4" /> },
  { id: "privacy", label: "Privacy & Security", icon: <Lock className="w-4 h-4" /> },
  { id: "verification", label: "Verification", icon: <Shield className="w-4 h-4" /> },
  { id: "connected", label: "Connected Accounts", icon: <LinkIcon className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "preferences", label: "Preferences", icon: <Palette className="w-4 h-4" /> },
  { id: "personalization", label: "Personalization", icon: <Briefcase className="w-4 h-4" /> },
  { id: "billing", label: "Billing & Plans", icon: <CreditCard className="w-4 h-4" />, badge: "Pro" },
  { id: "integrations", label: "API & Integrations", icon: <Zap className="w-4 h-4" /> },
  { id: "activity", label: "Activity Log", icon: <Activity className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [isSaving, setIsSaving] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState<VerificationSummary | null>(null);
  const [verificationModalState, setVerificationModalState] = useState<{
    isOpen: boolean;
    type: "email" | "phone";
  }>({ isOpen: false, type: "email" });

  // Account form
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    mode: "onBlur",
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      profile_visibility: "private",
    },
  });

  // Fetch verification summary
  const fetchVerificationSummary = async () => {
    try {
      const data = await verificationService.getVerificationSummary();
      setVerificationSummary(data);
    } catch (error) {
      console.error("Failed to fetch verification summary", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      accountForm.setValue("email", user.email);
      accountForm.setValue("full_name", user.full_name || "");
      profileForm.setValue("username", user.username || "");
      profileForm.setValue("bio", user.bio || "");
      profileForm.setValue("profile_visibility", (user.profile_visibility as "public" | "private") || "private");
      fetchVerificationSummary();
    }
  }, [user]);

  const onAccountSubmit = async (data: AccountFormValues) => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        email: data.email,
        full_name: data.full_name,
      };

      if (data.current_password) {
        payload.current_password = data.current_password;
      }
      if (data.new_password) {
        payload.new_password = data.new_password;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to update settings");
        return;
      }

      toast.success("Account settings updated successfully");
      accountForm.reset(data);
    } catch (error) {
      toast.error("Failed to update account settings");
    } finally {
      setIsSaving(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to update profile");
        return;
      }

      toast.success("Profile settings updated successfully");
      profileForm.reset(data);
    } catch (error) {
      toast.error("Failed to update profile settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationSuccess = () => {
    fetchVerificationSummary();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Quick Stats Bar */}
      <QuickStatsBar
        stats={[
          { label: "Verification", value: `${verificationSummary?.verification_score || 0}%`, trend: (verificationSummary?.verification_score || 0) >= 50 ? "up" : "neutral" },
          { label: "Settings", value: tabs.length },
          { label: "Status", value: user.profile_visibility === "public" ? "Public" : "Private" },
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* Page Header - Jobs Style */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                <Settings2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/verification"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <Shield className="w-4 h-4" />
                Verification
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <nav className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02] ${activeTab === tab.id
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
                      }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-auto text-xs bg-gradient-to-r from-emerald-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                        {tab.badge}
                      </span>
                    )}
                    {tab.id === "verification" && verificationSummary && (
                      <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {verificationSummary.verification_score}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                {/* Account Tab */}
                {activeTab === "account" && (
                  <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Account Settings</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your email and password</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          {...accountForm.register("email")}
                        />
                        {accountForm.formState.errors.email && (
                          <ErrorMessage>{accountForm.formState.errors.email.message}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          type="text"
                          placeholder="John Doe"
                          {...accountForm.register("full_name")}
                        />
                        {accountForm.formState.errors.full_name && (
                          <ErrorMessage>{accountForm.formState.errors.full_name.message}</ErrorMessage>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="current_password">Current Password</Label>
                          <Input
                            id="current_password"
                            type="password"
                            placeholder="••••••••"
                            {...accountForm.register("current_password")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_password">New Password</Label>
                          <Input
                            id="new_password"
                            type="password"
                            placeholder="••••••••"
                            {...accountForm.register("new_password")}
                          />
                          {accountForm.formState.errors.new_password && (
                            <ErrorMessage>{accountForm.formState.errors.new_password.message}</ErrorMessage>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Profile Settings</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customize your public profile</p>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Button type="button" variant="outline" className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Change Photo
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">proofile.co/p/</span>
                          <Input
                            id="username"
                            type="text"
                            placeholder="yourname"
                            {...profileForm.register("username")}
                            className="flex-1"
                          />
                        </div>
                        {profileForm.formState.errors.username && (
                          <ErrorMessage>{profileForm.formState.errors.username.message}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          rows={4}
                          placeholder="Tell people about yourself..."
                          {...profileForm.register("bio")}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        {profileForm.formState.errors.bio && (
                          <ErrorMessage>{profileForm.formState.errors.bio.message}</ErrorMessage>
                        )}
                      </div>

                      <div>
                        <Label>Profile Visibility</Label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="radio"
                              value="public"
                              {...profileForm.register("profile_visibility")}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <Globe className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Public</div>
                              <div className="text-xs text-gray-500">Anyone can view your profile at proofile.co/p/{user.username || "username"}</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="radio"
                              value="private"
                              {...profileForm.register("profile_visibility")}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <EyeOff className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Private</div>
                              <div className="text-xs text-gray-500">Only you can see your profile</div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Privacy & Security Tab */}
                {activeTab === "privacy" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Privacy & Security</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account security settings</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Lock className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                          </div>
                        </div>
                        <Button variant="outline">Enable</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                            <p className="text-sm text-gray-500">Manage devices where you're logged in</p>
                          </div>
                        </div>
                        <Button variant="outline">View All</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Shield className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Download Your Data</h3>
                            <p className="text-sm text-gray-500">Get a copy of all your Proofile data</p>
                          </div>
                        </div>
                        <Button variant="outline">Request</Button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                      <div className="p-4 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-900/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-400">Delete Account</h4>
                            <p className="text-sm text-red-600 dark:text-red-500">Permanently delete your account and all data</p>
                          </div>
                          <Button variant="destructive">Delete Account</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Tab */}
                {activeTab === "verification" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Verification Center</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Verify your identity to build trust</p>
                      </div>
                      <Link href="/verification" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                        View Full Page <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Trust Score */}
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Verification Status</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {verificationSummary?.verification_score || 0}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-emerald-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${verificationSummary?.verification_score || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Verification Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <VerificationSettingsCard
                        icon={<Mail className="w-5 h-5 text-emerald-600" />}
                        title="Email"
                        isVerified={verificationSummary?.email_verified || false}
                        onVerify={() => setVerificationModalState({ isOpen: true, type: "email" })}
                      />
                      <VerificationSettingsCard
                        icon={<Smartphone className="w-5 h-5 text-green-600" />}
                        title="Phone"
                        isVerified={verificationSummary?.phone_verified || false}
                        onVerify={() => setVerificationModalState({ isOpen: true, type: "phone" })}
                      />
                      <VerificationSettingsCard
                        icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
                        title="Work Email"
                        isVerified={false}
                        comingSoon
                      />
                      <VerificationSettingsCard
                        icon={<Award className="w-5 h-5 text-emerald-600" />}
                        title="Government ID"
                        isVerified={verificationSummary?.identity_verified || false}
                        comingSoon
                      />
                    </div>

                    {/* Why Verify */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/50">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Why verify?</h4>
                      <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                        <li>• 3x more profile views</li>
                        <li>• Employers trust verified profiles</li>
                        <li>• Higher job match quality</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Notification Preferences</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Control how we contact you</p>
                    </div>

                    <div className="space-y-4">
                      <NotificationToggle
                        title="Email Notifications"
                        description="Receive updates about your account via email"
                        defaultChecked={true}
                      />
                      <NotificationToggle
                        title="Job Alerts"
                        description="Get notified about new job matches"
                        defaultChecked={true}
                      />
                      <NotificationToggle
                        title="Connection Requests"
                        description="Notify when someone wants to connect"
                        defaultChecked={true}
                      />
                      <NotificationToggle
                        title="Profile Views"
                        description="Know when someone views your profile"
                        defaultChecked={false}
                      />
                      <NotificationToggle
                        title="Marketing Emails"
                        description="Tips, product updates, and offers"
                        defaultChecked={false}
                      />
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Preferences</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Palette className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
                            <p className="text-sm text-gray-500">Choose light or dark mode</p>
                          </div>
                        </div>
                        <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="system">System</option>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Language</h3>
                            <p className="text-sm text-gray-500">Select your preferred language</p>
                          </div>
                        </div>
                        <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personalization Tab */}
                {activeTab === "personalization" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Personalization Settings</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customize your job search and career preferences</p>
                    </div>
                    <PersonalizationSettings />
                  </div>
                )}

                {/* Connected Accounts Tab */}
                {activeTab === "connected" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Connected Accounts</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Link your social and professional accounts</p>
                    </div>

                    <div className="space-y-4">
                      <ConnectedAccountCard
                        icon={<Linkedin className="w-5 h-5 text-[#0A66C2]" />}
                        name="LinkedIn"
                        description="Import your work history and connections"
                        isConnected={true}
                        username="@johndoe"
                      />
                      <ConnectedAccountCard
                        icon={<Github className="w-5 h-5" />}
                        name="GitHub"
                        description="Showcase your open source contributions"
                        isConnected={false}
                      />
                      <ConnectedAccountCard
                        icon={<Twitter className="w-5 h-5 text-[#1DA1F2]" />}
                        name="Twitter / X"
                        description="Share your professional updates"
                        isConnected={false}
                      />
                      <ConnectedAccountCard
                        icon={<Mail className="w-5 h-5 text-red-500" />}
                        name="Google Account"
                        description="Sign in with Google"
                        isConnected={true}
                        username={user.email}
                      />
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Why connect accounts?
                      </h4>
                      <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                        <li>• Auto-sync your professional profile</li>
                        <li>• One-click sign in across devices</li>
                        <li>• Import your work history automatically</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Billing & Plans Tab */}
                {activeTab === "billing" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Billing & Plans</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your subscription and billing</p>
                    </div>

                    {/* Current Plan */}
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                            <Star className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Free Plan</h3>
                            <p className="text-sm text-gray-500">Basic features</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">$0<span className="text-sm font-normal text-gray-500">/mo</span></span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        You're using 2 of 3 resume slots • 50 of 100 job applications
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>

                    {/* Upgrade Card */}
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Proofile Pro
                            <span className="text-xs bg-gradient-to-r from-emerald-500 to-emerald-500 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Unlock all premium features</p>
                        </div>
                      </div>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited resumes</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited job applications</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> AI-powered cover letters</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority support</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Advanced analytics</li>
                      </ul>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">$9.99<span className="text-sm font-normal text-gray-500">/mo</span></span>
                        <Button className="bg-gradient-to-r from-emerald-500 to-emerald-500 hover:from-emerald-600 hover:to-emerald-600">
                          Upgrade Now
                        </Button>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">No payment method</p>
                            <p className="text-sm text-gray-500">Add a card to upgrade</p>
                          </div>
                        </div>
                        <Button variant="outline">Add Card</Button>
                      </div>
                    </div>

                    {/* Billing History */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Billing History</h3>
                      <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No invoices yet</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* API & Integrations Tab */}
                {activeTab === "integrations" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">API & Integrations</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manage API keys and third-party integrations</p>
                    </div>

                    {/* API Keys */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Generate New Key
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">Production Key</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-800 rounded font-mono text-sm text-gray-700 dark:text-gray-300">
                            pk_live_••••••••••••••••
                          </code>
                          <Button variant="ghost" size="sm">Copy</Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">Revoke</Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Created Dec 1, 2024 • Last used 2 hours ago</p>
                      </div>
                    </div>

                    {/* Webhooks */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhooks</h3>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Add Endpoint
                        </Button>
                      </div>
                      <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                        <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">No webhooks configured</p>
                        <p className="text-sm text-gray-400">Get notified when events happen in your account</p>
                      </div>
                    </div>

                    {/* Documentation Link */}
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-300">Need help with the API?</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">Check out our developer documentation</p>
                        </div>
                      </div>
                      <Button variant="outline" className="flex items-center gap-2">
                        View Docs <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === "activity" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Activity Log</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Recent account activity and security events</p>
                      </div>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <ActivityLogItem
                        icon={<LogOut className="w-4 h-4" />}
                        title="Signed in"
                        description="Chrome on Windows"
                        time="2 minutes ago"
                        location="Johannesburg, South Africa"
                      />
                      <ActivityLogItem
                        icon={<Lock className="w-4 h-4" />}
                        title="Password changed"
                        description="Password was successfully updated"
                        time="3 days ago"
                      />
                      <ActivityLogItem
                        icon={<Mail className="w-4 h-4" />}
                        title="Email verified"
                        description={user.email}
                        time="1 week ago"
                        status="success"
                      />
                      <ActivityLogItem
                        icon={<Laptop className="w-4 h-4" />}
                        title="New device"
                        description="iPhone 15 Pro"
                        time="2 weeks ago"
                        location="Cape Town, South Africa"
                      />
                      <ActivityLogItem
                        icon={<User className="w-4 h-4" />}
                        title="Profile updated"
                        description="Changed bio and profile photo"
                        time="1 month ago"
                      />
                      <ActivityLogItem
                        icon={<Shield className="w-4 h-4" />}
                        title="Account created"
                        description="Welcome to Proofile!"
                        time="2 months ago"
                        status="success"
                      />
                    </div>

                    <div className="text-center">
                      <Button variant="ghost">Load More</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </main>

      <VerificationModal
        isOpen={verificationModalState.isOpen}
        onClose={() => setVerificationModalState(prev => ({ ...prev, isOpen: false }))}
        type={verificationModalState.type}
        onSuccess={handleVerificationSuccess}
        initialValue={verificationModalState.type === 'email' ? user?.email : ''}
      />
    </div>
  );
}

// Helper Components
function VerificationSettingsCard({
  icon,
  title,
  isVerified,
  onVerify,
  comingSoon = false
}: {
  icon: React.ReactNode;
  title: string;
  isVerified: boolean;
  onVerify?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${isVerified
      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
      </div>
      {isVerified ? (
        <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" /> Verified
        </span>
      ) : comingSoon ? (
        <span className="text-xs text-gray-400">Coming Soon</span>
      ) : (
        <Button size="sm" variant="outline" onClick={onVerify}>
          Verify
        </Button>
      )}
    </div>
  );
}

function NotificationToggle({
  title,
  description,
  defaultChecked
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-all duration-200 hover:scale-[1.02] ${checked ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : ""
            }`}
        />
      </button>
    </div>
  );
}

function ConnectedAccountCard({
  icon,
  name,
  description,
  isConnected,
  username
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  isConnected: boolean;
  username?: string;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${isConnected
      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}>
      <div className="flex items-center gap-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
          {isConnected && username ? (
            <p className="text-sm text-green-600 dark:text-green-400">{username}</p>
          ) : (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {isConnected ? (
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Disconnect
        </Button>
      ) : (
        <Button variant="outline" size="sm">
          Connect
        </Button>
      )}
    </div>
  );
}

function ActivityLogItem({
  icon,
  title,
  description,
  time,
  location,
  status
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  location?: string;
  status?: "success" | "warning" | "error";
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className={`p-2 rounded-lg ${status === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-600" :
        status === "warning" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
          status === "error" ? "bg-red-100 dark:bg-red-900/30 text-red-600" :
            "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        {location && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {location}
          </p>
        )}
      </div>
    </div>
  );
}
