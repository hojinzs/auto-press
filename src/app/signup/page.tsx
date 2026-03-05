"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Eye, EyeOff, ArrowRight, ChevronDown, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("약관에 동의해야 합니다.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          role: role,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Optional: Auto redirect after some time or just show success message
    }
  };

  if (success) {
    return (
      <div className="bg-[#f8f6f6] dark:bg-[#211311] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[580px] bg-white dark:bg-zinc-900 shadow-xl rounded-lg overflow-hidden border border-[#e63119]/5 p-12 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="size-20 text-green-500" />
          </div>
          <h2 className="text-4xl font-black mb-4">가입 신청 완료!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
            {email}으로 인증 메일을 보냈습니다. <br />
            이메일의 링크를 클릭하여 가입을 완료해 주세요.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#e63119] text-white px-8 h-14 rounded font-bold hover:opacity-90 transition-all shadow-lg"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f6] dark:bg-[#211311] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Navigation Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e63119]/10 px-6 md:px-20 py-4 bg-[#f8f6f6]/80 dark:bg-[#211311]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="text-[#e63119]">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold leading-tight tracking-tight uppercase font-(family-name:--font-newsreader)">Editorial Flow</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-sm opacity-70">Already have an account?</span>
          <Link 
            href="/login" 
            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded border border-[#e63119]/20 hover:border-[#e63119]/50 h-10 px-6 transition-colors text-sm font-semibold"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[580px] bg-white dark:bg-zinc-900 shadow-xl rounded-lg overflow-hidden border border-[#e63119]/5">
          <div className="h-1.5 w-full bg-[#e63119]"></div>
          <div className="p-8 md:p-12">
            <div className="mb-10 text-center">
              <h2 className="text-4xl font-black leading-tight tracking-tight mb-3 font-(family-name:--font-newsreader)">Join the Network</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Create your professional editorial profile.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSignUp}>
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
                <input 
                  className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all" 
                  placeholder="Jane Doe" 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Two Column Layout for Email and Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Professional Email</label>
                  <input 
                    className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all" 
                    placeholder="jane@editorial.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company Name</label>
                  <input 
                    className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all" 
                    placeholder="The New Times" 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your Role</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all appearance-none cursor-pointer pr-10"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option disabled value="">Select your professional title</option>
                    <option value="editor-in-chief">Editor-in-Chief</option>
                    <option value="content-marketer">Content Marketer</option>
                    <option value="seo-lead">SEO Lead</option>
                    <option value="managing-editor">Managing Editor</option>
                    <option value="contributor">Freelance Contributor</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="size-5" />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all pr-12" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#e63119] transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm Password</label>
                  <input 
                    className="w-full bg-[#f8f6f6] dark:bg-zinc-800 border-none focus:ring-1 focus:ring-[#e63119] rounded h-14 px-4 text-lg transition-all" 
                    placeholder="••••••••" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 py-2">
                <input 
                  className="mt-1 rounded border-[#e63119]/20 text-[#e63119] focus:ring-[#e63119] h-4 w-4" 
                  id="terms" 
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label className="text-sm text-slate-600 dark:text-slate-400" htmlFor="terms">
                  I agree to the <a className="underline text-[#e63119]" href="#">Terms of Service</a> and <a className="underline text-[#e63119]" href="#">Privacy Policy</a>.
                </label>
              </div>

              {/* Create Account Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-[#e63119] hover:bg-[#e63119]/90 text-white rounded h-16 text-xl font-bold transition-all shadow-lg hover:shadow-[#e63119]/20 disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  {!loading && <ArrowRight className="size-6" />}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-[#e63119]/5 text-center">
              <p className="text-slate-500 dark:text-slate-400 italic font-(family-name:--font-newsreader)">"The future of publishing is structured, seamless, and collaborative."</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-[10px] opacity-50 font-medium uppercase tracking-[0.3em] font-(family-name:--font-newsreader)">
        © 2024 Editorial Flow System — All Rights Reserved
      </footer>
    </div>
  );
}
