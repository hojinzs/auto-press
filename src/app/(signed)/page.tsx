import { FileText, Zap, TrendingUp, PenTool, ArrowRight, CheckCircle2, AlertCircle, Wifi } from "lucide-react";

// 가짜 데이터
const drafts = [
  {
    id: 1,
    title: "The Future of SEO: Beyond Keywords",
    status: "review",
    wordCount: 2340,
    voiceMatch: 96,
    updatedAt: "2시간 전",
  },
  {
    id: 2,
    title: "Q3 Marketing Trends Analysis",
    status: "draft",
    wordCount: 1820,
    voiceMatch: 91,
    updatedAt: "5시간 전",
  },
  {
    id: 3,
    title: "Sustainable Packaging Guide",
    status: "review",
    wordCount: 3100,
    voiceMatch: 94,
    updatedAt: "1일 전",
  },
];

const connections = [
  { id: 1, name: "myblog.com", status: "healthy", lastSync: "20분 전" },
  { id: 2, name: "techinsight.kr", status: "healthy", lastSync: "1시간 전" },
  { id: 3, name: "marketing.io", status: "warning", lastSync: "3시간 전" },
];

const stats = [
  {
    label: "WORDS GENERATED",
    value: "12.4k",
    change: "+12%",
    changeLabel: "vs last week",
    positive: true,
  },
  {
    label: "VOICE CONSISTENCY",
    value: "94%",
    change: "+2%",
    changeLabel: "vs last month",
    positive: true,
  },
  {
    label: "POSTS PUBLISHED",
    value: "28",
    change: "+5",
    changeLabel: "this week",
    positive: true,
  },
  {
    label: "SEO SCORE AVG",
    value: "87",
    change: "+3",
    changeLabel: "vs last week",
    positive: true,
  },
];

const quickActions = [
  { label: "New Draft", icon: PenTool, href: "#" },
  { label: "Schedule Post", icon: FileText, href: "#" },
  { label: "Run Voice Calibration", icon: Zap, href: "#" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <AlertCircle className="h-3 w-3" />
        Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      <FileText className="h-3 w-3" />
      Draft
    </span>
  );
}

function ConnectionStatus({ status }: { status: string }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Slow
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header / Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-(family-name:--font-newsreader)">
          The Desk
        </h1>
        <p className="text-muted-foreground">
          Good morning, Editor. You have{" "}
          <span className="font-semibold text-foreground">3 drafts</span>{" "}
          awaiting review and{" "}
          <span className="font-semibold text-foreground">
            5 posts scheduled
          </span>{" "}
          for this week.
        </p>
        <p className="text-sm text-muted-foreground">
          Your system is{" "}
          <span className="text-emerald-600 font-medium">98% calibrated</span>{" "}
          to the brand voice. The latest vector indexing completed 20 minutes
          ago.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs">
              <span
                className={
                  stat.positive ? "text-emerald-600" : "text-red-600"
                }
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground">{stat.changeLabel}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Drafts */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold text-lg">Active Drafts</h2>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-medium truncate">{draft.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{draft.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>Voice: {draft.voiceMatch}%</span>
                    <span>•</span>
                    <span>{draft.updatedAt}</span>
                  </div>
                </div>
                <StatusBadge status={draft.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Connection Health */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Connection Health
              </h2>
            </div>
            <div className="divide-y">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{conn.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last sync: {conn.lastSync}
                    </p>
                  </div>
                  <ConnectionStatus status={conn.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-lg">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <blockquote className="italic text-sm text-muted-foreground font-(family-name:--font-newsreader) leading-relaxed">
              &ldquo;The essence of editing is the ability to kill your
              darlings.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
