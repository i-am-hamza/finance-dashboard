import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Content column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar — hidden on desktop */}
        <TopBar />

        {/* Page content. pb-16 on mobile leaves room for the fixed bottom nav. */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — fixed, hidden on desktop */}
      <BottomNav />
    </div>
  );
}
