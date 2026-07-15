import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/webhooks/paypal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePaymentWebhookRequest } = await import("../server/payments/webhook-endpoint");
        const { MysqlPaymentsRepository } = await import("../server/repositories/mysql");
        return handlePaymentWebhookRequest({
          providerCode: "paypal",
          request,
          paymentsRepository: new MysqlPaymentsRepository(),
        });
      },
    },
  },
});
