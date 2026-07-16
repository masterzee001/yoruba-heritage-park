import { describe, expect, test } from "bun:test";

import { buildPaymentLaunchChecklist } from "../src/config/payment-launch-checklist";
import { getPaymentProviderLaunchGuides } from "../src/config/payment-provider-launch";

describe("payment launch checklist", () => {
  test("keeps final domain and provider setup pending for preview configuration", () => {
    const checklist = buildPaymentLaunchChecklist({
      launchStatus: {
        checkoutEnabled: false,
        allowLiveCapture: false,
        paypalEnvironment: "sandbox",
      },
      providerReadiness: [],
      webhookGuides: getPaymentProviderLaunchGuides("https://yhp-preview.deedoc.org"),
      adminOrigin: "https://yhp-preview.deedoc.org",
    });

    expect(checklist.find((item) => item.id === "final-domain")?.state).toBe("pending");
    expect(checklist.find((item) => item.id === "live-capture")?.state).toBe("ready");
    expect(checklist.find((item) => item.id === "provider-readiness")?.state).toBe("pending");
  });

  test("marks live provider settings as blocked until deliberate launch", () => {
    const checklist = buildPaymentLaunchChecklist({
      launchStatus: {
        checkoutEnabled: true,
        allowLiveCapture: true,
        paypalEnvironment: "live",
      },
      providerReadiness: [
        { providerCode: "paypal", integrationReady: true, missingConfiguration: [] },
        { providerCode: "paystack", integrationReady: true, missingConfiguration: [] },
        { providerCode: "stripe", integrationReady: true, missingConfiguration: [] },
      ],
      webhookGuides: getPaymentProviderLaunchGuides("https://yorubaheritagepark.example"),
      adminOrigin: "https://yorubaheritagepark.example",
    });

    expect(checklist.find((item) => item.id === "final-domain")?.state).toBe("ready");
    expect(checklist.find((item) => item.id === "live-capture")?.state).toBe("blocked");
    expect(checklist.find((item) => item.id === "paypal-mode")?.state).toBe("blocked");
    expect(checklist.find((item) => item.id === "provider-readiness")?.state).toBe("ready");
  });
});
