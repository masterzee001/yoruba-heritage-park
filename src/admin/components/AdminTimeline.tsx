import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  detail?: ReactNode;
}

export function AdminTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline entries recorded.</p>;
  }
  return (
    <ol className="relative ml-3 border-l border-border">
      {items.map((it) => (
        <li key={it.id} className="mb-5 ml-4 last:mb-0">
          <span
            aria-hidden
            className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-forest bg-background"
          />
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{it.time}</p>
          <p className="mt-0.5 text-sm font-medium text-forest-deep">{it.title}</p>
          {it.detail ? <div className="mt-1 text-xs text-charcoal">{it.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
