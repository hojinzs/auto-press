"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh(); // Refresh to update server components with new session
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
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

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg p-8 md:p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold leading-tight mb-2 font-(family-name:--font-ibarra-real-nova)">Welcome Back</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Sign in to access your creative workspace.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSignIn}>
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

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
              <a className="text-xs text-[#e63119] hover:underline" href="#">Forgot?</a>
            </div>
            <div className="relative group">
              <input 
                className="w-full h-12 px-4 bg-[#f8f6f6] dark:bg-slate-800 border-none rounded focus:ring-1 focus:ring-[#e63119] transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 pr-10" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#e63119] transition-colors" 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#e63119] text-white font-semibold rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="size-5" />}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 tracking-widest">Or continue with</span>
          </div>
        </div>

        {/* Social Login Placeholder */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="flex items-center justify-center h-12 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="size-5 mr-2 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
              <img alt="Google Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV2XQ_i_9kQGnQB0H1oUu1doJRzXYsz6wQbi9AMv92ASrUimcURT7zJxgOnkq8I8el-Dk9FnKfLEZHhrQCBgdQYFdgdY9agCxtUgRaV1WrSPGIrF112ijrhwcbedY2BSiZWWM-MJ0ECE6UN_DC3Hub_nhFAn8zt4VTM8aoNRikXvbfyAfuKBFup6icFj-OpykAPMatAmQrEpD0_MMPqrVKvnxC0Jthh7HVnLijrIXzrxGr3WimHJAUXmPADruimXqrgulfMsXPfaY" />
            </div>
            <span className="text-sm font-medium">Google</span>
          </button>
          
          <button 
            type="button"
            onClick={() => handleSocialLogin('apple')}
            className="flex items-center justify-center h-12 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="size-5 mr-2 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
              <img alt="Apple Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFtZQQOey6t4aWw7QDnT6wthSB0aFYV7EstFumvboW_XFKaoG_HBB8SrmxsA-RiLutjoRE0-g46gRXHi1-k5vsGnaHgUXdrXvlyfyu2jOO0l-SZCiFK-Q0X1ChcoQ1h5pcc4GMvmhGHyrjgmryRVDHb0LTeF5xB6KuQTGp7NdQmGpSM7B-_q4S_KD4j4hX5lqoKdhZ3M3CLF-7K5A8Bkgcf2Ca52-SY-qBbEctz-LeddMiaKPmmf0AogESJywdoOHZclKLrb7zV_A" />
            </div>
            <span className="text-sm font-medium">Apple</span>
          </button>
        </div>

        {/* Bottom Link */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {`New to the platform? `}
            <Link className="text-[#e63119] font-semibold hover:underline decoration-2 underline-offset-4" href="/signup">Create an account</Link>
          </p>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="mt-12 text-slate-400 dark:text-slate-600 text-xs uppercase tracking-[0.2em] font-medium">
        © 2024 Editorial Flow Ltd.
      </footer>
    </div>
  );
}
