import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminDetailPanel({ title, eyebrow, actions, children, className }: Props) {
  return (
    <section className={cn("rounded-sm border border-border bg-background", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-1 font-serif text-xl text-forest-deep">{title}</h2>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-border/60 py-2.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-charcoal">{children}</dd>
    </div>
  );
}
