import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/app/auth/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const message = (await searchParams)?.message;

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
          Supabase auth
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Sign in</h1>
        <p className="mt-4 leading-7 text-ink/70">
          Enter your email and Supabase will send a secure sign-in link. This
          keeps the site private without needing a weak shared passcode.
        </p>

        <form action={signInWithEmail} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-md border border-ink/10 bg-mist px-3 text-sm text-ink outline-none transition focus:border-moss focus:bg-white"
            />
          </label>

          {message ? (
            <p className="rounded-md border border-skyglass bg-skyglass/70 px-3 py-2 text-sm leading-6 text-ink">
              {message}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Send sign-in link
          </Button>
        </form>

        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/dashboard">View dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
