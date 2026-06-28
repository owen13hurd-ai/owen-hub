import { Search } from "lucide-react";

import { signOut } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/Button";
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
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/90 px-4 py-3 backdrop-blur sm:px-7 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink">Personal command center</p>
          <p className="text-xs text-ink/40">
            {email ? email : "Private workspace"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" aria-label="Search">
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
