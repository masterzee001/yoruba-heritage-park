import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const blockedPatterns = [
  "YorÃ¹bÃ¡",
  "OrÃ­kÃ¬",
  "ORÃKÃŒ",
  "Ã€",
  "Ã¨",
  "Ã³",
  "Ã¹",
  "Ã¡",
  "â€”",
  "â†’",
  "â†",
  "â€™",
  "â€œ",
  "â€",
  "â€¦",
  "â‚¦",
  "Â",
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
