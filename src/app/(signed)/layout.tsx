import { Sidebar } from "@/components/layout/sidebar";

export default function SignedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 bg-background">
        {children}
      </main>
    </div>
  );
}
