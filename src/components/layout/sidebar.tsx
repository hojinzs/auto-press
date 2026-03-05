"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Settings, Globe, FileText, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const email = user?.email ?? "";
  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : "";

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r bg-background flex flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="font-bold text-xl font-(family-name:--font-newsreader)">
          Auto-Press
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md bg-secondary/50 px-3 py-2 text-sm font-medium text-secondary-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          The Desk
        </Link>
        <Link
          href="/voice-profile"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
        >
          <Users className="h-4 w-4" />
          Voice Profile
        </Link>
        <Link
          href="/drafts"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
        >
          <FileText className="h-4 w-4" />
          Content Drafts
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </Link>

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace
          </p>
        </div>

        <Link
          href="/settings/connections"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          Connected Blogs
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{initials}</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
