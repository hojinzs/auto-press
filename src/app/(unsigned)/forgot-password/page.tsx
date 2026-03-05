"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f5f2eb] dark:bg-[#211311] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 relative z-0">
      {/* Background Pattern Decoration (Subtle) */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUW22eSgVBNlq37ExIlKD6n3lCpJN4w89msxVJPuUAq2SQjoZu2cCEhnaNuqr4BFfpRnEuJ6chwcMoBE8eVT9lj7gCrBJW7SanuQoU2Y9SK_Z9nzArNdV29U-qMN-RDs9LJ4GyRIaVIFt_GIaNwXvbOJTQDHxpF6vwIsLtQ0JcKjwwmU_BeWAdfCXR0j0dQeBNXdiqTkfH-p5Whfb1ow_gDG-LgHf99url6AqxiEri7hB1LjeaXMp8GTWax271PFd4-6whmlZb3e8')" }}
      />

      {/* Logo Section */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="size-10 text-[#e63119]">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight font-(family-name:--font-ibarra-real-nova)">Editorial Flow</h2>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg p-8 md:p-10">
        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Mail className="size-16 text-[#e63119]" />
            </div>
            <h1 className="text-3xl font-bold leading-tight mb-3 font-(family-name:--font-ibarra-real-nova)">Check Your Email</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
              We sent a password reset link to
            </p>
            <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-8">
              {email}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-8">
              If you don&apos;t see the email, check your spam folder.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-12 bg-[#e63119] text-white font-semibold rounded hover:opacity-90 transition-opacity gap-2"
            >
              Back to Sign In
              <ArrowRight className="size-5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold leading-tight mb-2 font-(family-name:--font-ibarra-real-nova)">Reset Password</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </div>

            <form className="space-y-6" onSubmit={handleResetRequest}>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</label>
                <input
                  className="w-full h-12 px-4 bg-[#f8f6f6] dark:bg-slate-800 border-none rounded focus:ring-1 focus:ring-[#e63119] transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  placeholder="editor@editorialflow.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#e63119] text-white font-semibold rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send Reset Link"}
                {!loading && <ArrowRight className="size-5" />}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {"Remember your password? "}
                <Link className="text-[#e63119] font-semibold hover:underline decoration-2 underline-offset-4" href="/login">Sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer Decoration */}
      <footer className="mt-12 text-slate-400 dark:text-slate-600 text-xs uppercase tracking-[0.2em] font-medium">
        &copy; 2024 Editorial Flow Ltd.
      </footer>
    </div>
  );
}
