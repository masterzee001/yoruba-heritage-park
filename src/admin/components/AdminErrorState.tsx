import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function AdminErrorState({
  title = "This section could not be loaded",
  description = "Try again in a moment. If the problem continues, contact an administrator.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="size-5 text-destructive" aria-hidden />
      <div>
        <p className="font-serif text-lg text-forest-deep">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
