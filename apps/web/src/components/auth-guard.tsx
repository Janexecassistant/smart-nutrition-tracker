"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * AuthGuard wraps pages that require authentication.
 *
 * Behaviour:
 * 1. Not logged in → redirect to /auth/signin
 * 2. Logged in but hasn't completed onboarding → redirect to /onboarding
 * 3. Logged in + onboarding done → render children
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, hasProfile, checkProfile } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/signin");
      return;
    }

    // If we haven't checked the profile yet, check it
    if (hasProfile === null) {
      checkProfile().then((completed) => {
        if (!completed) {
          router.replace("/onboarding");
        } else {
          setChecking(false);
        }
      });
    } else if (!hasProfile) {
      router.replace("/onboarding");
    } else {
      setChecking(false);
    }
  }, [user, isLoading, hasProfile, router, checkProfile]);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
