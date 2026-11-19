import { z } from "zod";
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_PATTERN } from "./credentials";

export const usernameInput = z.string().trim().regex(new RegExp(`^${USERNAME_PATTERN}$`)).toLowerCase();
const password = z.string().min(1).max(PASSWORD_MAX);
export const newPassword = password.min(PASSWORD_MIN);
export const loginInput = z.strictObject({ username: usernameInput, password });
export const registrationInput = z.strictObject({ username: usernameInput, password: newPassword });
export type Credentials = z.infer<typeof loginInput>;
