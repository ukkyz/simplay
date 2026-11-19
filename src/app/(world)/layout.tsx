import type { ReactNode } from "react";
import { requireAccount } from "@/auth/server";
import { AppShell } from "@/components/AppShell";
import { readWorld } from "@/db/server-world";
import { SimplayzProvider } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function WorldLayout({ children }: { children: ReactNode }) {
  const account = await requireAccount();
  const initial = await readWorld();
  return (
    <SimplayzProvider initial={initial}>
      <AppShell account={account}>{children}</AppShell>
    </SimplayzProvider>
  );
}
