"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/*
 * Per-tab sign-in. The session cookie is shared by every tab, so on its own a new tab (or
 * clicking "Client login" again) would silently sign you in. We also keep a flag in
 * sessionStorage, which is scoped to one tab: logging in sets it, and signed-in areas
 * require it. A tab without the flag is sent to the login form (other tabs stay signed in).
 * This is a UX rule on top of the cookie; real authorization still lives in src/lib/dal.ts.
 */
const KEY = "lumora:tab-signed-in";
/** Appended by server redirects that sign the user in outside a form (e.g. the email verification link). */
export const SIGNED_IN_HASH = "#signed-in";

function read() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

const CHANGE = "lumora:tab-session";

function write(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the guard will simply ask for a login again.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

/** Whether this tab is signed in (false on the server and during hydration). */
export function useTabSignedIn() {
  return useSyncExternalStore(subscribe, read, () => false);
}

/** Renders signed-in pages only in a tab where the user logged in; otherwise asks them to log in. */
export function TabSessionGuard({ children }: { children: ReactNode }) {
  const signedIn = useTabSignedIn();

  useEffect(() => {
    if (window.location.hash === SIGNED_IN_HASH) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      write(true);
      return;
    }
    if (!read()) {
      const next = window.location.pathname + window.location.search;
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, []);

  return signedIn ? children : null;
}

/** On the auth pages: any submitted form (log in, sign up, reset, invite) marks this tab as signed in. */
export function MarkTabOnSubmit() {
  useEffect(() => {
    const onSubmit = () => write(true);
    document.addEventListener("submit", onSubmit);
    return () => document.removeEventListener("submit", onSubmit);
  }, []);
  return null;
}

/** Log out button for the dashboards; also clears this tab's flag. */
export function LogoutButton({ action, className }: { action: () => Promise<void>; className?: string }) {
  return (
    <form action={action} onSubmit={() => write(false)}>
      <button className={className}>Log out</button>
    </form>
  );
}
