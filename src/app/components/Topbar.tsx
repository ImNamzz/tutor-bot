"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  BookOpen,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { isAuthenticated, removeAccessToken } from "@/app/lib/auth";
import { toast } from "sonner";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  // Transcript button removed globally

  useEffect(() => {
    setMounted(true);

    // Check authentication
    const authenticated = isAuthenticated();
    setIsAuth(authenticated);

    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
  }, []);

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
    <nav className="bg-card dark:bg-card shadow-sm border-b border-border dark:border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 dark:text-white">EduAssist</span>
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
                AI Tutor
              </Link>
              {/* Transcript button removed */}
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
