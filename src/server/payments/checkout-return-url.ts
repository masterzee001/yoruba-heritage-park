export type CheckoutReturnStatus = "success" | "cancelled";

export function appendCheckoutReturnParams(
  url: string,
  input: {
    readonly status: CheckoutReturnStatus;
    readonly paymentReference: string;
    readonly providerCode: string;
  },
): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const base = trimmed.startsWith("/") ? "https://yhp.local" : undefined;
  const parsed = new URL(trimmed, base);
  parsed.searchParams.set("checkout", input.status);
  parsed.searchParams.set("paymentReference", input.paymentReference);
  parsed.searchParams.set("provider", input.providerCode);

  if (base && parsed.origin === base) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  return parsed.toString();
}
