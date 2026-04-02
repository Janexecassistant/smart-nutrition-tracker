"use client";

import { useAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/auth-guard";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Smart<span className="text-emerald-600">Nutrition</span> Tracker
        </h1>
        <p className="text-xl text-neutral-500">
          Track your food. Hit your goals. Know what to eat next.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/auth/signup"
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/auth/signin"
            className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
