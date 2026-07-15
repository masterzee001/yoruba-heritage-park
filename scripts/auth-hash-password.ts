import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { hashPassword, passwordHashProfile } from "../src/server/auth/password";

const password = process.argv[2] ?? (await promptPassword());
if (!password) {
  console.error("Password is required.");
  process.exit(1);
}

console.error(
  `Hashing with scrypt N=${passwordHashProfile.N}, r=${passwordHashProfile.r}, p=${passwordHashProfile.p}. Protect terminal history and redirected output.`,
);
console.log(await hashPassword(password));

async function promptPassword(): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return await rl.question("Password (input may echo in this terminal): ");
  } finally {
    rl.close();
  }
}
