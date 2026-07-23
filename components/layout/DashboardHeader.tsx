import { Search, ShieldCheck } from "lucide-react";

import { signOut } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig, shouldRequireAuth } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function DashboardHeader() {
  let email: string | undefined;

  if (hasSupabaseConfig() && shouldRequireAuth()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">Personal command center</p>
          <p className="truncate text-xs font-medium text-ink/45">
            {email ? email : "Private workspace"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-ink/10 bg-mist px-3 py-2 text-xs font-semibold text-ink/55 sm:flex">
            <ShieldCheck className="h-4 w-4 text-moss" aria-hidden="true" />
            Local first
          </div>
          <Button variant="outline" size="icon" aria-label="Search" className="bg-white/80">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
          {email ? (
            <form action={signOut}>
              <Button type="submit">Sign out</Button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
