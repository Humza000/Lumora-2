import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { getCurrentUser } from "@/lib/dal";
import { logout, resendVerification } from "../actions";

export const metadata: Metadata = { title: "Check your email" };

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.emailVerified) redirect(user.role === "ADMIN" ? "/admin" : "/quote");
  const { error } = await searchParams;

  return (
    <>
      <h1 className="font-display text-4xl font-semibold">Check your email</h1>
      {error === "invalid" && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          That verification link is invalid or has expired. Request a new one below.
        </p>
      )}
      <p className="mt-2 text-sm text-ink-muted">
        We sent a verification link to <strong className="text-ink">{user.email}</strong>. Click it to confirm your
        address, then you can start your quote.
      </p>
      <ActionForm action={resendVerification} className="mt-6">
        <SubmitButton variant="secondary" className="w-full" pendingText="Sending…">
          Resend verification email
        </SubmitButton>
      </ActionForm>
      <form action={logout} className="mt-4 text-center">
        <button className="text-sm text-ink-muted hover:underline">Use a different account</button>
      </form>
    </>
  );
}
