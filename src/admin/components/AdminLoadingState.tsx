interface Props {
  rows?: number;
  label?: string;
}

export function AdminLoadingState({ rows = 4, label = "Loading records…" }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-sm border border-border bg-background p-4"
    >
      <p className="sr-only">{label}</p>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-sm bg-cream/80"
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
