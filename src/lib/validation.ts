import { z } from "zod";
import { poundsToPence } from "./money";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200)
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  company: z.string().trim().max(120).optional().default(""),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

/** Only allow same-site relative redirects. */
export function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Where a client may be sent after logging in or verifying their email. */
export function clientNext(next: unknown, fallback: string) {
  const safe = safeNext(next, "");
  return safe.startsWith("/portal") || safe.startsWith("/quote") ? safe : fallback;
}

export const pence = z
  .union([z.string(), z.number()])
  .transform((v) => poundsToPence(v))
  .refine((v) => Number.isFinite(v) && v >= 0, "Enter a valid amount, e.g. 1250 or 1250.50");

export const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date");

export const requiredDate = z
  .string()
  .min(1, "Required")
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Enter a valid date");

export const optionalText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
