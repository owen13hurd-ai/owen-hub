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
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-mist/95 px-5 py-4 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink/60">Owen&apos;s Hub</p>
          <p className="text-xs text-ink/45">
            {email ? `Signed in as ${email}` : "First foundation build"}
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
