import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { peekToken } from "@/lib/tokens";
import { resetPassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const reset = typeof token === "string" ? await peekToken(token, "PASSWORD_RESET") : null;

  if (!reset) {
    return (
      <>
        <h1 className="font-display text-4xl font-semibold">Link expired</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This reset link is invalid, has already been used, or has expired. Reset links last 1 hour.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-light hover:underline">
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Choose a new password</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        For <strong className="text-ink">{reset.user.email}</strong>
      </p>
      <ActionForm action={resetPassword}>
        <input type="hidden" name="token" value={token as string} />
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          required
        />
        <TextField label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
        <SubmitButton className="w-full">Save password & log in</SubmitButton>
      </ActionForm>
    </>
  );
}
