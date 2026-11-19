"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { signIn, signUp } from "@/auth/actions";
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN, USERNAME_PATTERN, type AuthFormState } from "@/auth/credentials";
import { cn } from "@/utils/cn";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registering ? signUp : signIn, {}, `/${mode}`);
  const [showPassword, setShowPassword] = useState(false);
  const fieldClass = "min-h-12 w-full rounded-xl border border-[#7c8476] bg-white px-3.5 text-base text-ink hover:border-ink aria-invalid:border-[#9b3921]";

  return (
    <form action={action} className="space-y-5" aria-labelledby="auth-heading">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-bold">Username</label>
        <input
          className={fieldClass}
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={USERNAME_MIN}
          maxLength={USERNAME_MAX}
          pattern={USERNAME_PATTERN}
          defaultValue={state.username}
          aria-invalid={state.field === "username" || undefined}
          aria-describedby={cn(registering && "username-hint", state.field === "username" && "auth-error") || undefined}
        />
        {registering && <p id="username-hint" className="mt-1.5 text-sm text-ink-soft">3–24 letters, numbers, underscores or hyphens. Start with a letter or number.</p>}
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">Password</label>
        <div className="relative">
          <input
            className={cn(fieldClass, "pr-[4.75rem]")}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={registering ? "new-password" : "current-password"}
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={registering ? PASSWORD_MIN : undefined}
            maxLength={PASSWORD_MAX}
            aria-invalid={state.field === "password" || undefined}
            aria-describedby={cn(registering && "password-hint", state.field === "password" && "auth-error") || undefined}
          />
          <button
            type="button"
            className="absolute inset-y-1 right-1 w-16 rounded-lg text-sm font-bold text-ink-soft hover:bg-bone"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {registering && <p id="password-hint" className="mt-1.5 text-sm text-ink-soft">Use at least 12 characters. A passphrase works well.</p>}
      </div>
      {state.error && <p role="alert" id="auth-error" className="rounded-xl border border-[#cd7c64] bg-coral-soft px-3.5 py-3 text-sm font-semibold text-[#762c19]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-ink bg-ink px-4 text-sm font-bold text-paper transition-colors hover:bg-ink-soft disabled:opacity-70"
      >
        {pending ? (registering ? "Creating account…" : "Signing in…") : (registering ? "Create account" : "Sign in")}
        <ArrowRight size={16} aria-hidden="true" className="text-lime" />
      </button>
      <span role="status" className="sr-only">{pending ? (registering ? "Creating account" : "Signing in") : ""}</span>
    </form>
  );
}
