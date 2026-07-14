import { Info } from "lucide-react";
import { projectStatus } from "@/config/project-status";

interface Props {
  variant?: "default" | "compact" | "danger";
  message?: string;
}

/**
 * Always-visible reminder that operational data shown is demonstration data.
 * Never remove this component from a route without explicit approval.
 */
export function PreviewModeBanner({ variant = "default", message }: Props) {
  if (projectStatus.contentMode !== "preview") return null;

  const tone =
    variant === "danger"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-brass/40 bg-brass/10 text-earth";

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-xs ${tone} ${
        variant === "compact" ? "" : "sm:text-sm"
      }`}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide">
          Demonstration data · preview mode
        </p>
        <p className="mt-1 leading-relaxed">
          {message ??
            "Records shown here are sample data. No production booking, payment, message or emergency response is connected."}
        </p>
      </div>
    </div>
  );
}
