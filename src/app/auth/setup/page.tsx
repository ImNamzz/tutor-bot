"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { toast } from "sonner";
import { BookOpen, Loader2, Eye, EyeOff, CheckCircle, Info } from "lucide-react";
import { API_ENDPOINTS } from "@/app/lib/config";
import { validatePassword } from "@/app/lib/passwordValidation";

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Apply theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please sign in first.");
      router.push("/auth/login");
      return;
    }

    // Fetch current user profile to get username
    const fetchProfile = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.getUserProfile, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUsername(data.username);
          setUsername(data.username);
        } else {
          toast.error("Failed to load profile.");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        toast.error("Network error. Please try again.");
      } finally {
        setIsFetchingProfile(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Validate password requirements
    const validation = validatePassword(password, username);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      router.push("/auth/login");
      return;
    }

    try {
      let usernameUpdated = false;
      let passwordSet = false;

      // Update username if changed
      if (username !== currentUsername) {
        const usernameResponse = await fetch(API_ENDPOINTS.updateUsername, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        });

        if (usernameResponse.ok) {
          usernameUpdated = true;
        } else {
          const data = await usernameResponse.json();
          toast.error(data.detail || "Failed to update username.");
          setIsLoading(false);
          return;
        }
      }

      // Set password
      const passwordResponse = await fetch(API_ENDPOINTS.updatePassword, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: "",
          new_password: password,
        }),
      });

      if (passwordResponse.ok) {
        passwordSet = true;
      } else {
        const data = await passwordResponse.json();
        toast.error(data.detail || "Failed to set password.");
        setIsLoading(false);
        return;
      }

      // Success
      if (usernameUpdated && passwordSet) {
        toast.success("Account setup complete!");
      } else if (passwordSet) {
        toast.success("Password set successfully!");
      } else if (usernameUpdated) {
        toast.success("Username updated!");
      }

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Setup error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("You can set up your account later in Settings.");
    router.push("/");
  };

  if (isFetchingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 dark:bg-gray-900 dark:border-gray-800">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Account Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set your username and password to secure your account
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <Label htmlFor="username" className="dark:text-gray-200">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1"
              minLength={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {currentUsername}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="password" className="dark:text-gray-200">
                Password
              </Label>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="focus:outline-none">
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="text-xs space-y-1">
                      <p className="font-medium">Password must contain:</p>
                      <ul className="list-disc list-inside pl-2 space-y-0.5">
                        <li>At least 6 characters</li>
                        <li>One uppercase letter</li>
                        <li>One number</li>
                        <li>One special character (@, #, $, etc.)</li>
                        <li>Different from username</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="dark:text-gray-200">
              Confirm Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error("Please type your password confirmation manually");
                }}
                required
                disabled={isLoading}
                className="pr-10"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Setup Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>

          {/* Skip Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSkip}
            disabled={isLoading}
          >
            Skip for Now
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>You can always change these settings later in your profile.</p>
        </div>
      </Card>
    </div>
  );
}
