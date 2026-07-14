import { cn } from "@/lib/utils";
import type { StatusTone } from "../types";

const TONE: Record<StatusTone, string> = {
  neutral: "bg-cream text-charcoal border-border",
  info: "bg-indigo-deep/10 text-indigo-deep border-indigo-deep/20",
  success: "bg-forest/10 text-forest-deep border-forest/20",
  warning: "bg-brass/15 text-earth border-brass/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
  preview: "bg-clay/10 text-clay border-clay/25",
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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DemoBadge() {
  return <AdminStatusBadge tone="preview">Demo</AdminStatusBadge>;
}
