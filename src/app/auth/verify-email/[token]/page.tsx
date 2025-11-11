"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { CheckCircle, XCircle, Loader2, BookOpen } from "lucide-react";
import { API_ENDPOINTS } from "@/app/lib/config";

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(
          API_ENDPOINTS.verifyEmail(params.token)
        );

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully!");
        } else {
          setStatus("error");
          const data = await response.json();
          setMessage(data.detail || "Verification failed. The link may be expired.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Network error. Please try again later.");
      }
    };

    verifyEmail();
  }, [params.token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 dark:bg-gray-900 dark:border-gray-800 text-center">
        <div className="flex justify-center mb-4">
          <BookOpen className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Email...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
              <br />
              You can now sign in to your account.
            </p>
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/auth/register")}
                className="w-full"
              >
                Register Again
              </Button>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
