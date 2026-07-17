import { ShieldOff } from "lucide-react";

interface Props {
  message?: string;
}

/**
 * Cosmetic permission notice. Frontend visibility is not security;
 * real authorisation must be enforced server-side.
 */
export function PermissionNotice({ message }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
      <ShieldOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        {message ??
          "Role visibility in this interface is informational. Permission checks are enforced by the server."}
      </p>
    </div>
  );
}
