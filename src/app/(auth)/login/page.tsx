import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, verified } = await searchParams;
  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Log in</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Clients and the Lumora team sign in here.</p>
      {verified && (
        <p role="status" className="mb-4 rounded-xl border border-success/25 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          Your email is verified. Log in to continue.
        </p>
      )}
      <ActionForm action={login}>
        <input type="hidden" name="next" value={typeof next === "string" ? next : ""} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
        <p className="-mt-1 text-right text-sm">
          <Link href="/forgot-password" className="text-brand-light hover:underline">
            Forgot password?
          </Link>
        </p>
        <SubmitButton className="w-full" pendingText="Signing in…">
          Log in
        </SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New to Lumora?{" "}
        <Link href="/signup" className="font-medium text-brand-light hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
