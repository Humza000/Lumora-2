import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, Honeypot, SubmitButton, TextField } from "@/components/forms";
import { signup } from "../actions";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        You&apos;ll need an account to get a quote. It lets you save your answers and track your project once we start.
      </p>
      <ActionForm action={signup}>
        <Honeypot />
        <TextField label="Your name" name="name" autoComplete="name" required />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Business name (optional)" name="company" autoComplete="organization" />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          required
        />
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-light hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
