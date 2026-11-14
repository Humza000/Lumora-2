"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession, readSession } from "@/lib/session";
import { emails } from "@/lib/email";
import { consumeToken, issueToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { clientNext, loginSchema, passwordSchema, safeNext, signupSchema } from "@/lib/validation";
import { z } from "zod";

// Compared against when the email doesn't exist, so login timing doesn't reveal accounts.
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash("not-a-real-password", 12));

export async function signup(_: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("company_website")) return { error: "Something went wrong. Please try again." }; // honeypot
  if (!(await rateLimit("signup", 5, 60 * 60 * 1000)).ok) {
    return { error: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = signupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { name, email, company, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Please log in instead." };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "CLIENT",
      profile: { create: { company: company || null } },
    },
  });

  const next = clientNext(formData.get("next"), "");
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  const sent = await emails.verifyEmail(email, name, token, next);
  await createSession({ userId: user.id, role: "CLIENT", verified: false });
  redirect(checkEmailUrl(next, sent));
}

function checkEmailUrl(next: string, sent = true) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (!sent) params.set("error", "send");
  const qs = params.toString();
  return qs ? `/check-email?${qs}` : "/check-email";
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("login", 10, 15 * 60 * 1000)).ok) {
    return { error: "Too many login attempts. Please wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return { error: "Incorrect email or password." };

  await createSession({ userId: user.id, role: user.role, verified: Boolean(user.emailVerified) });

  const next = safeNext(formData.get("next"), "");
  if (user.role === "ADMIN") redirect(next.startsWith("/admin") ? next : "/admin");
  if (!user.emailVerified) redirect(checkEmailUrl(clientNext(next, "")));
  redirect(clientNext(next, "/portal"));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function resendVerification(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!(await rateLimit("resend-verification", 3, 15 * 60 * 1000)).ok) {
    return { error: "Please wait a few minutes before requesting another email." };
  }
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  const next = clientNext(formData.get("next"), "");
  if (user.emailVerified) redirect(next || "/quote");
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  const sent = await emails.verifyEmail(user.email, user.name, token, next);
  if (!sent) return { error: "We couldn't send the email just now. Please try again in a minute." };
  return { ok: true, message: `A new verification email is on its way to ${user.email}.` };
}

const RESET_REQUESTED =
  "If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour.";

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("password-reset", 5, 15 * 60 * 1000)).ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  const email = z.email("Enter a valid email").trim().toLowerCase().safeParse(formData.get("email"));
  if (!email.success) return { fieldErrors: { email: [email.error.issues[0].message] } };

  // Same answer whether or not the account exists, so this can't be used to discover accounts.
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (user) {
    const token = await issueToken(user.id, "PASSWORD_RESET");
    await emails.passwordReset(user.email, user.name, token);
  }
  return { ok: true, message: RESET_REQUESTED };
}

export async function resetPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { fieldErrors: { password: [password.error.issues[0].message] } };
  if (formData.get("password") !== formData.get("confirm")) {
    return { fieldErrors: { confirm: ["Passwords don't match"] } };
  }

  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) return { error: "This reset link is invalid or has expired. Please request a new one." };

  // Using the emailed link also proves they own the address.
  const existing = await db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  const user = await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password.data, 12), emailVerified: existing?.emailVerified ?? new Date() },
  });
  await createSession({ userId: user.id, role: user.role, verified: true });
  redirect(user.role === "ADMIN" ? "/admin" : "/portal");
}

export async function acceptInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { fieldErrors: { password: [password.error.issues[0].message] } };
  if (formData.get("password") !== formData.get("confirm")) {
    return { fieldErrors: { confirm: ["Passwords don't match"] } };
  }

  const userId = await consumeToken(token, "INVITE");
  if (!userId) return { error: "This invitation link is invalid or has expired. Ask us to send a new one." };

  const user = await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password.data, 12), emailVerified: new Date() },
  });
  await createSession({ userId: user.id, role: user.role, verified: true });
  redirect(user.role === "ADMIN" ? "/admin" : "/portal");
}
