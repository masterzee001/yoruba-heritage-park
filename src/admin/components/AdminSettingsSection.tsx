import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  values: Record<string, string>;
  action?: ReactNode;
}

export function AdminSettingsSection({ title, description, values, action }: Props) {
  return (
    <section className="rounded-sm border border-border bg-background">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-lg text-forest-deep">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </header>
      <dl className="divide-y divide-border/60 px-5">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="grid gap-2 py-3 text-sm sm:grid-cols-[220px_minmax(0,1fr)]">
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">{key}</dt>
            <dd className="text-charcoal">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
