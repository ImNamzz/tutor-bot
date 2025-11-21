"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import {
  BookOpen,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  LogOut,
  Settings,
  Eye,
  EyeOff,
  Info,
  Check,
  X,
} from "lucide-react";
import { Input } from '@/app/components/ui/input';
import { Button as UIButton } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { isAuthenticated, removeAccessToken } from "@/app/lib/auth";
import { toast } from "sonner";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'customization' | 'security'>('customization');
  const [tempTheme, setTempTheme] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [settingsData, setSettingsData] = useState({
    username: '',
    email: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    hasPassword: true,
    isGoogleAccount: false
  });
  // Transcript button removed globally

  useEffect(() => {
    setMounted(true);
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSettingsOpen && isAuth) {
        try {
          const { userAPI } = await import("@/app/lib/api");
          const profile = await userAPI.getProfile();
          setSettingsData(prev => ({
            ...prev,
            username: profile.username,
            email: profile.email,
            hasPassword: profile.has_password,
            isGoogleAccount: profile.is_google_account
          }));
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
        setIsChangingEmail(false);
        setSettingsTab('customization');
        setTempTheme(isDarkMode);
      }
    };
    fetchUserProfile();
  }, [isSettingsOpen, isAuth]);

  useEffect(() => {
    if (!mounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode, mounted]);

  const handleLogout = () => {
    removeAccessToken();
    setIsAuth(false);
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  return (
    <nav className="bg-[#000000] dark:bg-[#000000] shadow-sm border-b border-border dark:border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 dark:text-white">EduAssist</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/tutor"
                className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                  pathname === "/tutor"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                AI Tutor
              </Link>
              <Link
                href="/calendar"
                className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                  pathname === "/calendar"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings Cogwheel Icon for Account Settings - moved to left of theme toggle */}
            {isAuth && (
              <>
                {/* Use Radix UI Dialog for modal */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full w-9 h-9 p-0"
                      aria-label="Account Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-[#1a1a1a] text-white dark:text-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Account Settings</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[400px]">
                      {/* Tabs Sidebar */}
                      <div className="w-40 border-r border-gray-700 pr-4">
                        <nav className="space-y-1">
                          <button
                            onClick={() => setSettingsTab('customization')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'customization' ? 'bg-indigo-900/20 text-indigo-400' : 'text-gray-300 hover:bg-gray-800'}`}
                          >
                            Customization
                          </button>
                          <button
                            onClick={() => setSettingsTab('security')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${settingsTab === 'security' ? 'bg-indigo-900/20 text-indigo-400' : 'text-gray-300 hover:bg-gray-800'}`}
                          >
                            Security
                          </button>
                        </nav>
                      </div>
                      {/* Content Area */}
                      <div className="flex-1 pl-6 pr-5 overflow-y-auto">
                        {settingsTab === 'customization' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Customization</h3>
                              {/* Username */}
                              <div className="space-y-2 mb-6">
                                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                <Input
                                  id="username"
                                  type="text"
                                  placeholder="Enter username"
                                  value={settingsData.username}
                                  onChange={(e) => setSettingsData({...settingsData, username: e.target.value})}
                                  className="bg-[#212121] border-gray-700"
                                />
                              </div>
                              {/* Theme Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Appearance</Label>
                                <div className="flex items-center justify-between p-3 bg-[#212121] rounded-lg border border-gray-700">
                                  <span className="text-sm">Dark Mode</span>
                                  <button
                                    onClick={() => setTempTheme(!tempTheme)}
                                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                                    style={{ backgroundColor: tempTheme ? '#6366f1' : '#374151' }}
                                  >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tempTheme ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                              <UIButton
                                variant="outline"
                                onClick={() => {
                                  setIsSettingsOpen(false);
                                  setTempTheme(isDarkMode);
                                }}
                                className="border-gray-700"
                              >
                                Cancel
                              </UIButton>
                              <UIButton
                                onClick={() => {
                                  if (tempTheme !== isDarkMode) {
                                    setIsDarkMode(tempTheme);
                                    localStorage.setItem('theme', tempTheme ? 'dark' : 'light');
                                    if (tempTheme) {
                                      document.documentElement.classList.add('dark');
                                    } else {
                                      document.documentElement.classList.remove('dark');
                                    }
                                  }
                                  toast.success('Profile updated successfully!');
                                  setIsSettingsOpen(false);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Save Changes
                              </UIButton>
                            </div>
                          </div>
                        )}
                        {settingsTab === 'security' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Security</h3>
                              {/* Email Section */}
                              <div className="space-y-2 mb-6">
                                <Label htmlFor="current-email" className="text-sm font-medium">Current Email</Label>
                                {!isChangingEmail ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="current-email"
                                      type="email"
                                      value={settingsData.email}
                                      readOnly={settingsData.isGoogleAccount}
                                      disabled={settingsData.isGoogleAccount}
                                      className={settingsData.isGoogleAccount ? "bg-gray-800 border-gray-700 cursor-not-allowed text-gray-400" : "bg-[#212121] border-gray-700 cursor-default"}
                                    />
                                    {!settingsData.isGoogleAccount && (
                                      <UIButton variant="outline" onClick={() => setIsChangingEmail(true)} className="border-gray-700 whitespace-nowrap">Change Email</UIButton>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-400 mb-2">Current: {settingsData.email}</div>
                                    <Input
                                      id="new-email"
                                      type="email"
                                      placeholder="Enter new email"
                                      value={settingsData.newEmail}
                                      onChange={(e) => setSettingsData({...settingsData, newEmail: e.target.value})}
                                      className="bg-[#212121] border-gray-700"
                                    />
                                    <div className="flex gap-2">
                                      <UIButton variant="outline" size="sm" onClick={() => { setIsChangingEmail(false); setSettingsData({...settingsData, newEmail: ''}); }} className="border-gray-700">Cancel</UIButton>
                                    </div>
                                  </div>
                                )}
                                {settingsData.isGoogleAccount && (
                                  <p className="text-xs text-gray-400">Email cannot be changed for Google accounts</p>
                                )}
                              </div>
                              {/* Password Section */}
                              <div className="space-y-4 border-t border-gray-700 pt-6">
                                <h4 className="text-sm font-semibold">{settingsData.hasPassword ? 'Change Password' : 'Set Password'}</h4>
                                {!settingsData.hasPassword && (
                                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-sm text-blue-200">You signed in with Google. Set a password to enable email/password login as a backup.</div>
                                )}
                                {/* Current Password - only show if user has password */}
                                {settingsData.hasPassword && (
                                  <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                                    <div className="relative">
                                      <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter current password"
                                        value={settingsData.currentPassword}
                                        onChange={(e) => setSettingsData({...settingsData, currentPassword: e.target.value})}
                                        className="bg-[#212121] border-gray-700 pr-10"
                                      />
                                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {/* New Password */}
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                                  <div className="relative">
                                    <Input
                                      id="newPassword"
                                      type={showNewPassword ? "text" : "password"}
                                      placeholder="Enter new password"
                                      value={settingsData.newPassword}
                                      onChange={(e) => setSettingsData({...settingsData, newPassword: e.target.value})}
                                      className="bg-[#212121] border-gray-700 pr-10"
                                    />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </div>
                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                  </div>
                                  <div className="relative">
                                    <Input
                                      id="confirmPassword"
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirm new password"
                                      value={settingsData.confirmPassword}
                                      onChange={(e) => setSettingsData({...settingsData, confirmPassword: e.target.value})}
                                      className="bg-[#212121] border-gray-700 pr-10"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                              <UIButton variant="outline" onClick={() => { setIsSettingsOpen(false); setIsChangingEmail(false); setTempTheme(isDarkMode); setSettingsData(prev => ({ ...prev, newEmail: '', currentPassword: '', newPassword: '', confirmPassword: '' })); }} className="border-gray-700">Cancel</UIButton>
                              <UIButton onClick={() => { toast.success('Security settings updated!'); setIsSettingsOpen(false); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</UIButton>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button
              onClick={() => setIsDarkMode((v) => !v)}
              variant="ghost"
              size="sm"
              className="rounded-full w-9 h-9 p-0"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-foreground/80" />
              )}
            </Button>
            {isAuth ? (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
