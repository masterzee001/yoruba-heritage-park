import { cn } from "@/lib/utils";
import type { StatusTone } from "../types";

const TONE: Record<StatusTone, string> = {
  neutral: "bg-cream text-charcoal border-border",
  info: "bg-indigo-deep/10 text-indigo-deep border-indigo-deep/25",
  success: "bg-forest/12 text-forest-deep border-forest/25",
  warning: "bg-brass/20 text-earth border-brass/40",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
  preview: "bg-clay/12 text-clay border-clay/30",
};

interface Props {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function AdminStatusBadge({ tone = "neutral", children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-forest",
          tone === "danger" && "bg-destructive",
          tone === "warning" && "bg-brass",
          tone === "info" && "bg-indigo-deep",
          tone === "preview" && "bg-clay",
          (tone === "neutral" || tone === "muted") && "bg-muted-foreground/70",
        )}
      />
      {children}
    </span>
  );
}

export function DemoBadge() {
  return <AdminStatusBadge tone="preview">Demo</AdminStatusBadge>;
}
