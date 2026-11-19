import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { readWorld } from "@/db/server-world";
import { SimplayzProvider } from "@/lib/store";
import "../index.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Simplayz — Your world, in play", template: "%s · Simplayz" },
  description: "Simplayz is your OpenStreetMap world simulator — build player areas, shape buildings, and run your AI management crew.",
};

export const viewport: Viewport = { themeColor: "#f2f0e6" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initial = await readWorld();
  return (
    <html lang="en">
      <body>
        <SimplayzProvider initial={initial}>
          <AppShell>{children}</AppShell>
        </SimplayzProvider>
      </body>
    </html>
  );
}
