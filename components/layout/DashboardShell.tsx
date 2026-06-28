import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <Sidebar />
      <div className="lg:pl-60">
        <DashboardHeader />
        <MobileNav />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
