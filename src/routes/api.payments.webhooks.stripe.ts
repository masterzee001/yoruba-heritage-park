import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePaymentWebhookRequest } = await import("../server/payments/webhook-endpoint");
        const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
        return handlePaymentWebhookRequest({
          providerCode: "stripe",
          request,
          paymentsRepository: new MysqlPaymentsRepository(),
        });
      },
    },
  },
});
