import { Lock } from "lucide-react";

interface Props {
  feature: string;
  reason?: string;
}

/**
 * Renders where a control would normally trigger a production feature that
 * is intentionally disabled in preview mode.
 */
export function FeatureDisabledNotice({ feature, reason }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-border bg-cream/60 px-4 py-3 text-xs text-charcoal">
      <Lock className="mt-0.5 size-4 shrink-0 text-earth" aria-hidden />
      <div>
        <p className="font-medium">{feature} is not enabled in preview mode.</p>
        <p className="mt-1 text-muted-foreground">
          {reason ?? "This action will be available once the production backend is connected."}
        </p>
      </div>
    </div>
  );
}
