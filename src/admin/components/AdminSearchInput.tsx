import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function AdminSearchInput({
  label = "Search records",
  className,
  placeholder = "Search records…",
  ...rest
}: Props) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="admin-focus min-h-10 w-full rounded-sm border border-border bg-background py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-muted-foreground focus:border-forest"
        {...rest}
      />
    </label>
  );
}
