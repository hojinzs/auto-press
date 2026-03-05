export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Auto-Press</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Intelligent WordPress Auto-Publishing System
      </p>
      <div className="mt-8">
        <a 
          href="/settings/connections" 
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          워드프레스 연동 관리 시작하기
        </a>
      </div>
    </div>
  );
}
