export interface ObservabilityBootstrapData {
  readonly appName: string;
  readonly analyticsEndpoint?: string;
  readonly monitoringEndpoint?: string;
}

export function getObservabilityBootstrapData(): ObservabilityBootstrapData | null {
  const analyticsEndpoint = cleanUrl(process.env.YHP_ANALYTICS_ENDPOINT);
  const monitoringEndpoint = cleanUrl(process.env.YHP_MONITORING_ENDPOINT);

  if (!analyticsEndpoint && !monitoringEndpoint) return null;

  return {
    appName: process.env.YHP_OBSERVABILITY_APP_NAME?.trim() || "Yoruba Heritage Park",
    analyticsEndpoint,
    monitoringEndpoint,
  };
}

export function serializeObservabilityBootstrapData(data: ObservabilityBootstrapData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function cleanUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
