"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card } from "@/app/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Loader2, CheckCircle } from "lucide-react";
import { API_ENDPOINTS } from "@/app/lib/config";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.status === 201) {
        // Success
        setRegistrationSuccess(true);
        toast.success("Registration successful! Please check your email.");
      } else if (response.status === 400) {
        // Email or username already exists
        toast.error(data.detail || "Email or username already taken.");
      } else {
        toast.error(data.detail || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check if the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 dark:bg-gray-900 dark:border-gray-800 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a verification link to <strong>{email}</strong>.
            <br />
            Please check your inbox and click the link to verify your account.
          </p>
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 dark:bg-gray-900 dark:border-gray-800">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign up to start learning with AI
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-4">
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
          </div>

          <div>
            <Label htmlFor="email" className="dark:text-gray-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="dark:text-gray-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1"
              minLength={6}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              At least 6 characters
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="dark:text-gray-200">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1"
              minLength={6}
            />
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
          </span>
          <Link
            href="/auth/login"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
