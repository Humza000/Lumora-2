import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-brand-light">404</p>
      <h1 className="mt-3 font-display text-6xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-ink-muted">The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      <ButtonLink href="/" className="mt-8">
        Back to home
      </ButtonLink>
    </main>
  );
}
