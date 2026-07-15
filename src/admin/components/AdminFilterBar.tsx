import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  label?: string;
}

export function AdminFilterBar({ children, className, label = "Filters" }: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "admin-focus min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-forest-deep bg-forest-deep text-ivory shadow-sm"
          : "border-border bg-background text-charcoal hover:border-forest hover:bg-cream/60",
      )}
    >
      {children}
    </button>
  );
}
