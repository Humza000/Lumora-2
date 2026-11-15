/**
 * Shown instantly while a portal/admin page loads its data (used by `loading.tsx`), so a click
 * on the sidebar responds straight away instead of waiting for the server.
 */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 h-10 w-56 rounded-xl bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-surface-2" />
        <div className="h-24 rounded-2xl bg-surface-2" />
        <div className="hidden h-24 rounded-2xl bg-surface-2 sm:block" />
      </div>
      <div className="mt-6 h-64 rounded-2xl bg-surface-2" />
    </div>
  );
}
