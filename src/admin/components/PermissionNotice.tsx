import { ShieldOff } from "lucide-react";

interface Props {
  message?: string;
}

/**
 * Cosmetic permission notice. Frontend visibility is NOT security —
 * real authorisation will be enforced server-side.
 */
export function PermissionNotice({ message }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
      <ShieldOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        {message ??
          "This area is restricted by role. Frontend visibility is not a security boundary — access is enforced server-side."}
      </p>
    </div>
  );
}
