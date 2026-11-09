"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";
import { Button, Input, Label, Select, Textarea, cn } from "./ui";

const FieldErrors = createContext<Record<string, string[] | undefined>>({});

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Form bound to a server action; shows form-level and per-field errors. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={formRef} action={formAction} className={cn("space-y-4", className)}>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      )}
      <FieldErrors.Provider value={state?.fieldErrors ?? {}}>{children}</FieldErrors.Provider>
    </form>
  );
}

/** Shows the first error for `name`; with `prefix`, also matches nested keys like `lines.0.unitPrice`. */
export function FieldError({ name, prefix }: { name: string; prefix?: boolean }) {
  const all = useContext(FieldErrors);
  const key = prefix ? Object.keys(all).find((k) => k === name || k.startsWith(`${name}.`)) : name;
  const errors = key ? all[key] : undefined;
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

type FieldProps = { label: string; name: string; hint?: string; className?: string };

export function TextField({ label, name, hint, className, ...props }: FieldProps & ComponentProps<"input">) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function TextAreaField({ label, name, hint, className, ...props }: FieldProps & ComponentProps<"textarea">) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} {...props} />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  className,
  ...props
}: FieldProps & ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <FieldError name={name} />
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** Hidden honeypot field: bots fill it, humans never see it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
