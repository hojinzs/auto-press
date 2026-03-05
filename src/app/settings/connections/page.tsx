"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AddSiteForm } from "@/components/AddSiteForm";
import { Loader2, Plus, Globe, Trash2, ShieldCheck, AlertCircle, RefreshCcw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordPressConnection {
  id: string;
  site_name: string;
  site_url: string;
  wp_username: string;
  status: "active" | "error";
  created_at: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<WordPressConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("wp_credentials")
        .select("id, site_name, site_url, wp_username, status, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setConnections(data || []);
    } catch (err: any) {
      setError(err.message || "연동 정보를 가져오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 사이트 연동을 삭제하시겠습니까? 관련 데이터가 더 이상 동기화되지 않습니다.")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("wp_credentials")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setConnections(connections.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <header className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">워드프레스 연동 관리</h1>
          <p className="text-muted-foreground italic">
            중앙 플랫폼에서 다수의 워드프레스 사이트를 안전하게 관리하세요.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            사이트 추가
          </button>
        )}
      </header>

      {showAddForm ? (
        <div className="bg-card border rounded-2xl p-8 shadow-sm ring-1 ring-border mb-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 bg-primary h-full" />
          <AddSiteForm 
            onSuccess={() => {
              setShowAddForm(false);
              fetchConnections();
            }} 
            onCancel={() => setShowAddForm(false)} 
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60">연동된 사이트 목록</h2>
            <button onClick={fetchConnections} className="text-muted-foreground hover:text-primary transition-colors">
                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
            <p className="text-sm text-muted-foreground">연동 정보를 불러오는 중입니다...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card border rounded-2xl shadow-sm text-center px-6">
            <Globe className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-medium">연동된 사이트가 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              오른쪽 상단의 '사이트 추가' 버튼을 눌러 첫 번째 프로젝트를 연결해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((site) => (
              <div 
                key={site.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-card border rounded-2xl transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center",
                    site.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        {site.site_name}
                        {site.status === "active" ? (
                             <span className="flex items-center text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                <span className="h-1 w-1 bg-green-600 rounded-full mr-1 animate-pulse" />
                                Connected
                             </span>
                        ) : (
                            <span className="flex items-center text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                Error
                             </span>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <ExternalLink className="h-3 w-3" />
                      <a href={site.site_url} target="_blank" className="hover:underline">{site.site_url}</a>
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/80">
                         <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> {site.wp_username}
                         </span>
                         <span className="text-muted-foreground/20">|</span>
                         <span>연동일: {new Date(site.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleDelete(site.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="사이트 연동 해제"
                   >
                    <Trash2 className="h-5 w-5" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-16 bg-muted/30 rounded-2xl p-6 border border-dashed border-muted">
        <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
            <AlertCircle className="h-4 w-4 text-primary" /> 보안 알림
        </h4>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
            <li>모든 워드프레스 자격 증명은 Supabase의 **pgcrypto** 확장을 통해 데이터베이스 레벨에서 강력하게 암호화되어 저장됩니다.</li>
            <li>연결 정보는 오직 소유자 본인만 접근할 수 있도록 **Row Level Security (RLS)** 정책이 강제됩니다.</li>
            <li>사이트 URL은 데이터 탈취 방지를 위해 **HTTPS** 접속을 권장합니다.</li>
        </ul>
      </footer>
    </div>
  );
}
