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
    <header className="grid gap-4 border-b border-ink/10 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

