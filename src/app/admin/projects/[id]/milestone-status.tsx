"use client";

import { Select } from "@/components/ui";

/** Status dropdown that saves immediately on change. */
export function MilestoneStatus({ action, value }: { action: (fd: FormData) => Promise<void>; value: string }) {
  return (
    <form action={action}>
      <Select
        name="status"
        defaultValue={value}
        aria-label="Milestone status"
        className="w-36 py-1.5"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="DONE">Done</option>
      </Select>
    </form>
  );
}
