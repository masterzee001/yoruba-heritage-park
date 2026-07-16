import { describe, expect, test } from "bun:test";

import { sendAdminCredentialNotice } from "../src/server/notifications/email-service";

describe("email notification service", () => {
  test("skips delivery while email mode is disabled", async () => {
    const previousMode = process.env.EMAIL_DELIVERY_MODE;
    process.env.EMAIL_DELIVERY_MODE = "disabled";

    try {
      const result = await sendAdminCredentialNotice({
        toEmail: "admin@example.test",
        displayName: "Admin User",
        purpose: "invitation",
      });

      expect(result.status).toBe("skipped");
      expect(result.message).toContain("disabled");
    } finally {
      if (previousMode === undefined) {
        delete process.env.EMAIL_DELIVERY_MODE;
      } else {
        process.env.EMAIL_DELIVERY_MODE = previousMode;
      }
    }
  });
});
