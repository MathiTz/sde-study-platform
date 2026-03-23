"use client";

import { useFormStatus } from "react-dom";

export function SignInButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in with GitHub"}
    </button>
  );
}
