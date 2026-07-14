import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function AdminFilterBar({ children, className }: Props) {
  return (
    <div
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
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition",
        active
          ? "border-forest-deep bg-forest-deep text-ivory"
          : "border-border text-charcoal hover:border-forest",
      )}
    >
      {children}
    </button>
  );
}
