import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "danger";
  className?: string;
}

export function AdminStatCard({ label, value, hint, tone = "default", className }: Props) {
  return (
    <div
      className={cn(
        "rounded-sm border bg-background p-5",
        tone === "danger" ? "border-destructive/30" : "border-border",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-3 font-serif text-3xl",
          tone === "danger" ? "text-destructive" : "text-forest-deep",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
