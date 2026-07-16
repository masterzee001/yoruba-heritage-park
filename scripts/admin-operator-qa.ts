import { readFileSync } from "node:fs";
import { join } from "node:path";

interface Check {
  readonly name: string;
  readonly file: string;
  readonly patterns: RegExp[];
}

const root = process.cwd();

const checks: Check[] = [
  {
    name: "Admin booking payment history",
    file: "src/routes/admin.bookings.tsx",
    patterns: [
      /getAdminBookingPaymentHistory/,
      /Payment history/,
      /Requests and reconciliation/,
      /Webhook events/,
    ],
  },
  {
    name: "Admin payment review notes",
    file: "src/routes/admin.payments.tsx",
    patterns: [/recordPaymentReviewNote/, /Payment review note/, /Payment actions/, /Audit trail/],
  },
  {
    name: "Payment review audit server functions",
    file: "src/admin/payment-functions.ts",
    patterns: [
      /listPaymentAuditTrail/,
      /recordPaymentReviewNote/,
      /payments\.payment\.review_note\.saved/,
      /requireAdminServerPermission\("payments\.manage"\)/,
    ],
  },
  {
    name: "Database-backed audit route",
    file: "src/routes/admin.audit-logs.tsx",
    patterns: [/listAdminAuditLogs/, /Database-backed/, /Database audit records/],
  },
  {
    name: "Public booking and payment status guardrails",
    file: "src/routes/tickets.tsx",
    patterns: [
      /countryOfOrigin/,
      /durationOfStayDays/,
      /Payment collection is not active/,
      /Payment confirmation is completed only after the provider webhook is verified/,
    ],
  },
];

let failures = 0;

for (const check of checks) {
  const source = readFileSync(join(root, check.file), "utf8");
  const missing = check.patterns.filter((pattern) => !pattern.test(source));
  if (missing.length) {
    failures += missing.length;
    console.error(`[FAIL] ${check.name}: missing ${missing.map(String).join(", ")}`);
  } else {
    console.log(`[PASS] ${check.name}`);
  }
}

if (failures) {
  console.error(`Admin operator QA failed with ${failures} missing checks.`);
  process.exit(1);
}

console.log("Admin operator QA passed.");
