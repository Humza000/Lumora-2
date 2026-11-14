import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Forgot your password?</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <ActionForm action={requestPasswordReset} resetOnSuccess>
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <SubmitButton className="w-full" pendingText="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/login" className="font-medium text-brand-light hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
