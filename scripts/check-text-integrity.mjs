import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const blockedPatterns = [
  "Yor\u00c3\u00b9b\u00c3\u00a1",
  "Or\u00c3\u00adk\u00c3\u00ac",
  "OR\u00c3\u008dK\u00c3\u008c",
  "\u00c3\u20ac",
  "\u00c3\u00a8",
  "\u00c3\u00b3",
  "\u00c3\u00b9",
  "\u00c3\u00a1",
  "\u00e2\u20ac\u201d",
  "\u00e2\u20ac\u201c",
  "\u00e2\u2020\u2019",
  "\u00e2\u2020\u0090",
  "\u00e2\u20ac\u2122",
  "\u00e2\u20ac\u0153",
  "\u00e2\u20ac\u009d",
  "\u00e2\u20ac\u00a6",
  "\u00e2\u201a\u00a6",
  "\u00c2\u00b7",
  "\u00c2 ",
  "\u00c3\u201a",
  "Yor?b?",
  "Or?k?",
  " ? pending",
  " ? final",
  " ? to be confirmed",
];

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
]);

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => existsSync(file))
  .filter((file) => file !== "scripts/check-text-integrity.mjs")
  .filter((file) => {
    const dot = file.lastIndexOf(".");
    return dot >= 0 && textExtensions.has(file.slice(dot));
  });

const failures = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");

  if (text.charCodeAt(0) === 0xfeff) {
    failures.push(`${file}: contains a byte-order mark`);
  }

  for (const pattern of blockedPatterns) {
    if (text.includes(pattern)) {
      failures.push(`${file}: contains blocked text pattern ${JSON.stringify(pattern)}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Text integrity check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Text integrity check passed (${files.length} files scanned).`);
