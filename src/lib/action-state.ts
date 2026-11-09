import type { z } from "zod";

/** Standard return shape for server actions used with <ActionForm>. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | undefined;

export function fromZodError(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { error: "Please check the highlighted fields.", fieldErrors };
}

/** FormData -> plain object (checkbox groups with the same name become arrays). */
export function formToObject(fd: FormData, arrayKeys: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrayKeys.includes(key) ? all : all[0];
  }
  for (const key of arrayKeys) out[key] ??= [];
  return out;
}

export function fieldError(field: string, message: string): ActionState {
  return { fieldErrors: { [field]: [message] } };
}
