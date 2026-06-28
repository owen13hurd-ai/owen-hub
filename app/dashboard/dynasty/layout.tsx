import { DynastyNav } from "@/components/layout/DynastyNav";

export default function DynastyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DynastyNav />
      {children}
    </div>
  );
}

