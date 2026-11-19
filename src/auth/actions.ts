"use server";

import { redirect, RedirectType } from "next/navigation";
import { getDatabase } from "../db/client";
import { databaseErrorMessage } from "../db/config";
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN, type AuthFormState } from "./credentials";
import { allowAuthAttempt, AuthError, loginAccount, registerAccount } from "./repository";
import { clearSession, readSessionToken, setSessionCookie } from "./server";
import { loginInput, registrationInput } from "./validation";

function logUnavailability(error: unknown) {
  // Don't log credential inputs or SQL parameters.
  console.error("Account request failed:", databaseErrorMessage(error, "Database operation failed."));
}

async function authenticate(mode: "login" | "register", form: FormData): Promise<AuthFormState> {
  const rawUsername = form.get("username");
  const username = typeof rawUsername === "string" ? rawUsername.slice(0, USERNAME_MAX) : "";
  const parsed = (mode === "login" ? loginInput : registrationInput).safeParse({ username: rawUsername, password: form.get("password") });
  if (!parsed.success) {
    if (parsed.error.issues.some((issue) => issue.path[0] === "username")) {
      return { username, field: "username", error: `Use ${USERNAME_MIN}–${USERNAME_MAX} letters, numbers, underscores, or hyphens. Start with a letter or number.` };
    }
    return { username, field: "password", error: mode === "register" ? `Use a password with ${PASSWORD_MIN}–${PASSWORD_MAX} characters.` : "Enter your password." };
  }

  try {
    const db = getDatabase();
    if (!await allowAuthAttempt(db, mode, parsed.data.username)) {
      return { username, error: "Too many attempts. Try again in 15 minutes." };
    }
    const session = await (mode === "login" ? loginAccount : registerAccount)(db, parsed.data, await readSessionToken());
    await setSessionCookie(session);
  } catch (error) {
    if (error instanceof AuthError) return { username, error: error.message, field: error.status === 409 ? "username" : undefined };
    logUnavailability(error);
    return { username, error: databaseErrorMessage(error, "Account access is temporarily unavailable. Try again shortly.") };
  }
  redirect("/");
}

export async function signIn(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  return authenticate("login", form);
}

export async function signUp(_state: AuthFormState, form: FormData): Promise<AuthFormState> {
  return authenticate("register", form);
}

export async function signOut(): Promise<AuthFormState> {
  try {
    await clearSession();
  } catch (error) {
    logUnavailability(error);
    return { error: "Could not sign out. Try again shortly." };
  }
  redirect("/login", RedirectType.replace);
}
