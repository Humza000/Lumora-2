"use client";

import type { ReactNode } from "react";
import { SubmitButton } from "./forms";

/** Danger submit button that asks "are you sure?" first. Use inside <ActionForm>. */
export function ConfirmSubmit({ message, children, pendingText = "Deleting…" }: { message: string; children: ReactNode; pendingText?: string }) {
  return (
    <SubmitButton
      variant="ghost"
      className="text-danger"
      pendingText={pendingText}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </SubmitButton>
  );
}
