import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-moss">
            Personal operating system
          </p>
          <h1 className="text-5xl font-bold leading-tight text-ink sm:text-6xl">
            Owen&apos;s Hub
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/75">
            A growing home for dynasty football tools, Pokémon planning, career
            resources, travel ideas, notes, and future AI assistants.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
