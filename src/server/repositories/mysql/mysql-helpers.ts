import { randomUUID } from "node:crypto";

import { z } from "zod";

export const idSchema = z.string().trim().min(1).max(64);
export const emailSchema = z.string().trim().email().max(320);
export const codeSchema = z.string().trim().min(1).max(191);
export const limitSchema = z.number().int().min(1).max(100).default(25);

export function normaliseEmail(email: string): string {
  return emailSchema.parse(email).toLowerCase();
}

export function requireId(id: string): string {
  return idSchema.parse(id);
}

export function requireCode(code: string): string {
  return codeSchema.parse(code);
}

export function requireLimit(limit = 25): number {
  return limitSchema.parse(limit);
}

export function createRepositoryId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
