import { useEffect } from "react";

type ObservabilityConfig = {
  readonly appName: string;
  readonly analyticsEndpoint?: string;
  readonly monitoringEndpoint?: string;
};

declare global {
  interface Window {
    __YHP_OBSERVABILITY__?: ObservabilityConfig;
  }
}

function sendBeacon(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon(url, blob)) return;

  void fetch(url, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

export function ObservabilityBootstrap({ pathname }: { pathname: string }) {
  useEffect(() => {
    const config = window.__YHP_OBSERVABILITY__;
    if (!config?.analyticsEndpoint) return;

    sendBeacon(config.analyticsEndpoint, {
      type: "pageview",
      appName: config.appName,
      path: pathname,
      title: document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
    });
  }, [pathname]);

  useEffect(() => {
    const config = window.__YHP_OBSERVABILITY__;
    if (!config?.monitoringEndpoint) return;

    const report = (type: "heartbeat" | "error" | "rejection", details?: Record<string, unknown>) =>
      sendBeacon(config.monitoringEndpoint!, {
        type,
        appName: config.appName,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        ...details,
      });

    report("heartbeat");

    const onError = (event: ErrorEvent) => {
      report("error", {
        message: event.message,
        filename: event.filename || undefined,
        lineno: event.lineno || undefined,
        colno: event.colno || undefined,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      report("rejection", {
        reason:
          event.reason instanceof Error
            ? event.reason.message
            : typeof event.reason === "string"
              ? event.reason
              : "Unhandled rejection",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    const heartbeat = window.setInterval(() => report("heartbeat"), 5 * 60 * 1000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.clearInterval(heartbeat);
    };
  }, []);

  return null;
}
