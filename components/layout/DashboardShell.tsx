import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#f7faf8_0%,#eef4f0_48%,#f7faf8_100%)] text-ink">
      <Sidebar />
      <div className="lg:pl-60">
        <DashboardHeader />
        <MobileNav />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-7 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
