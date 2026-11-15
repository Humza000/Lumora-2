import "server-only";

/**
 * For database reads in pre-built (static) public pages. Deploys always have the database
 * (`prisma db push` runs before `next build`), but a local or CI build without one shouldn't fail:
 * during the build only, a failed query logs a warning and returns `fallback`. At runtime the error
 * is thrown as usual, so a background refresh that fails keeps serving the last good page.
 */
export async function buildSafe<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (err) {
    if (process.env.NEXT_PHASE !== "phase-production-build") throw err;
    console.warn("[build] database not reachable, building this page without its data:", (err as Error).message.split("\n").pop());
    return fallback;
  }
}
