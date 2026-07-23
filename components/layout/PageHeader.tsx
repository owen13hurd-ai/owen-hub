import type { ReactNode } from "react";

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="grid gap-4 rounded-md border border-ink/10 bg-white/80 p-5 shadow-[0_18px_50px_rgba(23,33,31,0.05)] backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <p className="text-sm font-bold text-moss">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
