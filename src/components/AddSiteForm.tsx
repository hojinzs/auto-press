"use client";

import { useState } from "react";
import { testWordPressConnection } from "@/utils/wordpress";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

interface AddSiteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddSiteForm({ onSuccess, onCancel }: AddSiteFormProps) {
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleTestConnection = async () => {
    if (!siteUrl || !username || !appPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    
    setIsTesting(true);
    setError(null);
    setTestResult(null);

    const result = await testWordPressConnection(siteUrl, username, appPassword);
    setTestResult(result as any);
    setIsTesting(false);
    
    if (!result.success) {
      setError(result.message || "연결 테스트에 실패했습니다.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !siteUrl || !username || !appPassword) {
      setError("모든 필드를 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // RPC 함수 호출 (암호화 처리)
      const { error: rpcError } = await supabase.rpc("add_wp_credential", {
        p_site_name: siteName,
        p_site_url: siteUrl,
        p_username: username,
        p_password: appPassword
      });

      if (rpcError) throw rpcError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || "사이트 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">새 사이트 연결</h3>
        <p className="text-sm text-muted-foreground">
          워드프레스 사이트의 REST API 정보를 입력하여 연동합니다.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="siteName" className="text-sm font-medium">사이트 이름 (별칭)</label>
            <input
              id="siteName"
              placeholder="예: 나의 개인 블로그"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="siteUrl" className="text-sm font-medium">워드프레스 URL</label>
            <input
              id="siteUrl"
              type="url"
              placeholder="https://example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="username" className="text-sm font-medium">사용자 아이디</label>
              <input
                id="username"
                placeholder="admin"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="appPassword" className="text-sm font-medium">애플리케이션 비밀번호</label>
              <input
                id="appPassword"
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isSaving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
          >
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            연결 테스트
          </button>
        </div>

        {testResult && testResult.success && (
          <div className="flex items-center p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            연결 확인됨: API가 정상적으로 작동합니다.
          </div>
        )}

        {error && (
          <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSaving || isTesting}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            사이트 연결하기
          </button>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" /> 도움말: 애플리케이션 비밀번호란?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
                워드프레스 관리자 화면의 [사용자] - [프로필] 페이지 하단에서 발급 가능한 16자리 코드입니다. 
                로그인 비밀번호 대신 사용하여 연동을 안전하게 관리할 수 있습니다. 
                <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" className="inline-flex items-center text-primary ml-1 hover:underline">
                    상세 가이드 <ExternalLink className="ml-0.5 h-3 w-3" />
                </a>
            </p>
        </div>
      </form>
    </div>
  );
}
