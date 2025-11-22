"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Bot,
  BookOpen,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  LogOut,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { isAuthenticated, removeAccessToken, getAccessToken, handleAuthError } from "@/app/lib/auth";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { API_ENDPOINTS } from "@/app/lib/config";
import { toast } from "sonner";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  // Transcript button removed globally
  
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"customization" | "security">("customization");
  const [settingsData, setSettingsData] = useState({
    username: "",
    email: "",
    newUsername: "",
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    hasPassword: true,
    isGoogleAccount: false,
  });
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [tempTheme, setTempTheme] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check authentication
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);

    // Fetch username if authenticated
    if (authenticated) {
      const fetchUsername = async () => {
        try {
          const token = getAccessToken();
          if (!token) return;

          const response = await fetch(API_ENDPOINTS.getCurrentUser, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUsername(data.username || null);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      };

      fetchUsername();
    }

    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

  // Fetch user profile when settings dialog opens
  useEffect(() => {
    if (isSettingsOpen && isAuth) {
      const fetchUserProfile = async () => {
        try {
          const token = getAccessToken();
          if (!token) {
            toast.error("You need to be logged in");
            return;
          }

          const response = await fetch(API_ENDPOINTS.getCurrentUser, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              handleAuthError(401);
              return;
            }
            throw new Error("Failed to fetch user profile");
          }

          const data = await response.json();
          setSettingsData((prev) => ({
            ...prev,
            username: data.username || "",
            email: data.email || "",
            hasPassword: data.has_password || false,
            isGoogleAccount: data.is_google_account || false,
          }));
          setTempTheme(isDarkMode); // Initialize temp theme
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast.error("Failed to load user profile");
        }
      };

      fetchUserProfile();
    }
  }, [isSettingsOpen, isAuth, isDarkMode]);

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

  const handleSaveSettings = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("You need to be logged in");
        return;
      }

      if (settingsTab === "customization") {
        // Apply theme change
        if (tempTheme !== isDarkMode) {
          setIsDarkMode(tempTheme);
          localStorage.setItem("theme", tempTheme ? "dark" : "light");
          if (tempTheme) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }

        // Save new username if provided
        if (settingsData.newUsername) {
          const response = await fetch(API_ENDPOINTS.updateUsername, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ username: settingsData.newUsername }),
          });

          if (!response.ok) {
            const data = await response.json();
            if (response.status === 401) {
              handleAuthError(401);
              return;
            }
            toast.error(data.detail || "Failed to update username");
            return;
          }

          // Update local copy and clear newUsername
          setSettingsData((prev) => ({ ...prev, username: prev.newUsername, newUsername: "" }));
        }

        toast.success("Profile updated successfully!");
        setIsSettingsOpen(false);
      } else if (settingsTab === "security") {
        // Update email if changing
        if (isChangingEmail && settingsData.newEmail) {
          const emailResponse = await fetch(API_ENDPOINTS.updateEmail, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email: settingsData.newEmail }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            if (emailResponse.status === 401) {
              handleAuthError(401);
              return;
            }
            toast.error(errorData.detail || "Failed to update email");
            return;
          }

          setSettingsData((prev) => ({
            ...prev,
            email: prev.newEmail || prev.email,
            newEmail: "",
          }));
          setIsChangingEmail(false);
        }

        // Update password if provided
        if (settingsData.newPassword) {
          if (settingsData.newPassword !== settingsData.confirmNewPassword) {
            toast.error("New passwords do not match");
            return;
          }

          const passwordResponse = await fetch(API_ENDPOINTS.updatePassword, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              old_password: settingsData.currentPassword,
              new_password: settingsData.newPassword,
            }),
          });

          if (!passwordResponse.ok) {
            const errorData = await passwordResponse.json();
            if (passwordResponse.status === 401) {
              handleAuthError(401);
              return;
            }
            toast.error(errorData.detail || "Failed to update password");
            return;
          }

          setSettingsData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          }));
        }

        toast.success("Settings updated successfully!");
        setIsSettingsOpen(false);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    }
  };

  return (
    <nav className="bg-card dark:bg-[#000000] shadow-sm border-b border-border dark:border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 dark:text-white">TutorBot</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                  pathname === "/"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Chat
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
            {isAuth && (
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-9 h-9 p-0"
                    aria-label="Settings"
                  >
                    <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Account Settings</DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex h-[500px]">
                    {/* Left Sidebar - Tabs */}
                    <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
                      <nav className="space-y-1">
                        <button
                          onClick={() => setSettingsTab('customization')}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            settingsTab === 'customization'
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          Customization
                        </button>
                        <button
                          onClick={() => setSettingsTab('security')}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            settingsTab === 'security'
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          Security
                        </button>
                      </nav>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 pl-6 pr-5 overflow-y-auto">
                      {settingsTab === 'customization' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Customization</h3>
                            
                            {/* Username */}
                            <div className="space-y-2 mb-6">
                              <Label htmlFor="username" className="text-sm font-medium">
                                Username
                              </Label>
                              <Input
                                id="new-username"
                                type="text"
                                placeholder="Enter new username"
                                value={settingsData.newUsername}
                                onChange={(e) => setSettingsData({...settingsData, newUsername: e.target.value})}
                                className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700"
                              />
                            </div>

                            {/* Theme Toggle */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Appearance
                              </Label>
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#212121] rounded-lg border border-gray-300 dark:border-gray-700">
                                <span className="text-sm">Dark Mode</span>
                                <button
                                  onClick={() => setTempTheme(!tempTheme)}
                                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                  style={{
                                    backgroundColor: tempTheme ? '#6366f1' : '#d1d5db'
                                  }}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      tempTheme ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Save Button */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsSettingsOpen(false)
                                setTempTheme(isDarkMode) // Reset temp theme on cancel
                                setSettingsData(prev => ({ ...prev, newUsername: '' }))
                              }}
                              className="border-gray-300 dark:border-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveSettings}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      )}

                      {settingsTab === 'security' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Security</h3>
                            
                            {/* Email Section */}
                            <div className="space-y-2 mb-6">
                              <Label htmlFor="current-email" className="text-sm font-medium">
                                Email
                              </Label>
                              {!isChangingEmail ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="current-email"
                                    type="email"
                                    value={settingsData.newEmail}
                                    placeholder=""
                                    disabled
                                    className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 cursor-default opacity-80"
                                  />
                                  {!settingsData.isGoogleAccount && (
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsChangingEmail(true)}
                                      className="border-gray-300 dark:border-gray-700 whitespace-nowrap"
                                    >
                                      Change Email
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    id="new-email"
                                    type="email"
                                    placeholder="Enter new email"
                                    value={settingsData.newEmail}
                                    onChange={(e) => setSettingsData({...settingsData, newEmail: e.target.value})}
                                    className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsChangingEmail(false)
                                        setSettingsData({...settingsData, newEmail: ''})
                                      }}
                                      size="sm"
                                      className="border-gray-300 dark:border-gray-700"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {settingsData.isGoogleAccount && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Email cannot be changed for Google accounts
                                </p>
                              )}
                            </div>

                            {/* Password Section */}
                            {settingsData.hasPassword && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="old-password" className="text-sm font-medium">
                                    Old Password
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="old-password"
                                      type={showCurrentPassword ? "text" : "password"}
                                      placeholder="Enter old password"
                                      value={settingsData.currentPassword}
                                      onChange={(e) => setSettingsData({...settingsData, currentPassword: e.target.value})}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="new-password" className="text-sm font-medium">
                                    New Password
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="new-password"
                                      type={showNewPassword ? "text" : "password"}
                                      placeholder="Enter new password"
                                      value={settingsData.newPassword}
                                      onChange={(e) => setSettingsData({...settingsData, newPassword: e.target.value})}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                                    Confirm New Password
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="confirm-password"
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirm new password"
                                      value={settingsData.confirmNewPassword}
                                      onChange={(e) => setSettingsData({...settingsData, confirmNewPassword: e.target.value})}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Save Button */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              onClick={() => setIsSettingsOpen(false)}
                              className="border-gray-300 dark:border-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveSettings}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              <>
                {username && (
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-3 py-2">
                    {username}
                  </span>
                )}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
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
