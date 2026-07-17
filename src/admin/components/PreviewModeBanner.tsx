import { Info } from "lucide-react";

import { projectStatus } from "@/config/project-status";

interface Props {
  variant?: "default" | "compact" | "danger";
  message?: string;
}

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
        <p className="text-[10px] font-medium uppercase tracking-wide">Operational setup pending</p>
        <p className="mt-1 leading-relaxed">
          {message ??
            "This module is not connected to a production workflow yet. Confirm details before using it for operations."}
        </p>
      </div>
    </div>
  );
}
