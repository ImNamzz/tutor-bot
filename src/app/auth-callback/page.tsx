"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const needsSetup = searchParams.get("setup");

    if (token) {
      // Store the access token
      localStorage.setItem("access_token", token);
      
      if (needsSetup === "true") {
        // New Google user - redirect to setup page
        toast.success("Welcome! Please set up your account.");
        setTimeout(() => {
          router.push("/auth/setup");
        }, 500);
      } else {
        // Existing user - redirect to home
        toast.success("Successfully signed in with Google!");
        setTimeout(() => {
          router.push("/");
        }, 500);
      }
    } else {
      // No token found - something went wrong
      setError("Authentication failed. No token received.");
      toast.error("Google Sign-In failed. Please try again.");
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing Sign In...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we finish setting up your account.
        </p>
      </div>
    </div>
  );
}
