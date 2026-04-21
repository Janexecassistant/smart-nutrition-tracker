"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const HERO_URL =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1600&q=85";

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
    <main className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Hero image panel */}
      <div
        className="relative h-[40vh] lg:h-screen lg:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_URL})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end lg:justify-between p-8 lg:p-12">
          <div className="hidden lg:block">
            <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Smart<span className="text-emerald-300">Nutrition</span>
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-white text-2xl lg:text-3xl font-semibold leading-tight drop-shadow-md">
              Start your journey.<br />Fuel your goals.
            </p>
            <p className="hidden lg:block text-white/80 text-base mt-4 leading-relaxed drop-shadow">
              Log your first meal in under 30 seconds. See calories, macros,
              and micronutrients with the same accuracy as Cronometer — but
              faster to use.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">
              Smart<span className="text-emerald-600">Nutrition</span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900">
              Create your account
            </h2>
            <p className="text-neutral-500 mt-2">
              Free to start. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
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

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{" "}
            <a
              href="/auth/signin"
              className="text-emerald-700 font-semibold hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
