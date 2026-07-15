import "@tanstack/react-start/server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const passwordHashProfile = {
  algorithm: "scrypt",
  version: 1,
  N: 32768,
  r: 8,
  p: 3,
  keyLength: 64,
  maxPasswordBytes: 4096,
} as const;

const hashPrefix = "$scrypt$v=1";
const defensiveHash = `${hashPrefix}$N=${passwordHashProfile.N}$r=${passwordHashProfile.r}$p=${passwordHashProfile.p}$ZmFrZV9zYWx0X25vdF9mb3JfcHJvZHVjdGlvbg==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==`;

export async function hashPassword(password: string): Promise<string> {
  assertPasswordInput(password);
  const salt = randomBytes(24);
  const derivedKey = (await scrypt(password, salt, passwordHashProfile.keyLength, {
    N: passwordHashProfile.N,
    r: passwordHashProfile.r,
    p: passwordHashProfile.p,
    maxmem: 256 * 1024 * 1024,
  })) as Buffer;
  return [
    hashPrefix,
    `N=${passwordHashProfile.N}`,
    `r=${passwordHashProfile.r}`,
    `p=${passwordHashProfile.p}`,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string | null,
): Promise<boolean> {
  const parsed = parseHash(encodedHash);
  if (!parsed || !isPasswordSizeAllowed(password)) return false;
  try {
    const derivedKey = (await scrypt(password, parsed.salt, parsed.key.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: 256 * 1024 * 1024,
    })) as Buffer;
    return derivedKey.length === parsed.key.length && timingSafeEqual(derivedKey, parsed.key);
  } catch {
    return false;
  }
}

export function needsPasswordRehash(encodedHash: string | null): boolean {
  const parsed = parseHash(encodedHash);
  if (!parsed) return true;
  return (
    parsed.version !== passwordHashProfile.version ||
    parsed.N !== passwordHashProfile.N ||
    parsed.r !== passwordHashProfile.r ||
    parsed.p !== passwordHashProfile.p ||
    parsed.key.length !== passwordHashProfile.keyLength
  );
}

export async function performDefensivePasswordHash(password: string): Promise<void> {
  await verifyPassword(password.slice(0, passwordHashProfile.maxPasswordBytes), defensiveHash);
}

function parseHash(encodedHash: string | null): {
  version: number;
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
} | null {
  if (!encodedHash || !encodedHash.startsWith(hashPrefix)) return null;
  const parts = encodedHash.split("$");
  if (parts.length !== 8 || parts[1] !== "scrypt") return null;
  const version = Number(parts[2]?.replace("v=", ""));
  const N = Number(parts[3]?.replace("N=", ""));
  const r = Number(parts[4]?.replace("r=", ""));
  const p = Number(parts[5]?.replace("p=", ""));
  if (![version, N, r, p].every(Number.isSafeInteger)) return null;
  try {
    const salt = Buffer.from(parts[6], "base64");
    const key = Buffer.from(parts[7], "base64");
    if (salt.length < 16 || key.length < 32) return null;
    return { version, N, r, p, salt, key };
  } catch {
    return null;
  }
}

function assertPasswordInput(password: string): void {
  if (!isPasswordSizeAllowed(password)) {
    throw new Error("Password input exceeds the accepted size.");
  }
}

function isPasswordSizeAllowed(password: string): boolean {
  return Buffer.byteLength(password, "utf8") <= passwordHashProfile.maxPasswordBytes;
}
