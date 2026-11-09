import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { peekToken } from "@/lib/tokens";
import { acceptInvite } from "../actions";

export const metadata: Metadata = { title: "Set up your account" };

export default async function AcceptInvitePage({ searchParams }: PageProps<"/accept-invite">) {
  const { token } = await searchParams;
  const invite = typeof token === "string" ? await peekToken(token, "INVITE") : null;

  if (!invite) {
    return (
      <>
        <h1 className="text-xl font-semibold">Invitation expired</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This link is invalid or has expired. Please contact us and we&apos;ll send a new one.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
          Go to login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Welcome, {invite.user.name}</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Set a password for <strong className="text-ink">{invite.user.email}</strong> to access your client portal.
      </p>
      <ActionForm action={acceptInvite}>
        <input type="hidden" name="token" value={token as string} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          required
        />
        <TextField label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
        <SubmitButton className="w-full">Set password & continue</SubmitButton>
      </ActionForm>
    </>
  );
}
