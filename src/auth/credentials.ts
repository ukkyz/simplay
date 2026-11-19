export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const USERNAME_PATTERN = `[A-Za-z0-9][A-Za-z0-9_\\-]{${USERNAME_MIN - 1},${USERNAME_MAX - 1}}`;

export interface AuthFormState {
  error?: string;
  field?: "username" | "password";
  username?: string;
}

export interface SignedInAccount {
  username: string;
  ownsWorld: boolean;
}
