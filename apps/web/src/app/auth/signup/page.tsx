"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Smart<span className="text-emerald-600">Nutrition</span> Tracker
          </h1>
          <p className="text-neutral-500 mt-2">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 bg-neutral-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-sm text-neutral-400">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* OAuth buttons (Phase 1 fast-follow) */}
        <div className="space-y-3">
          <button
            disabled
            className="w-full py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 flex items-center justify-center gap-2 opacity-60"
          >
            Continue with Google (coming soon)
          </button>
          <button
            disabled
            className="w-full py-3 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 flex items-center justify-center gap-2 opacity-60"
          >
            Continue with Apple (coming soon)
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{" "}
          <a href="/auth/signin" className="text-emerald-700 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
