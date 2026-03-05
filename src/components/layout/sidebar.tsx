import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Settings, Globe, FileText } from "lucide-react";

export function Sidebar() {
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
            <span className="text-sm font-medium text-primary">ED</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Editor</span>
            <span className="text-xs text-muted-foreground">editor@example.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
