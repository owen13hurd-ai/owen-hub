import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <Sidebar />
      <div className="lg:pl-72">
        <DashboardHeader />
        <MobileNav />
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
