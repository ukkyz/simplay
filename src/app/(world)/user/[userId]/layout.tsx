import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { readWorld } from "@/db/server-world";

export default async function PlayerLayout({ children, params }: { children: ReactNode; params: Promise<{ userId: string }> }) {
  const [{ userId }, { player }] = await Promise.all([params, readWorld()]);
  if (userId !== player.id) notFound();
  return children;
}
