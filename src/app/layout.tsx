import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../index.css";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: { default: "Simplayz — Your world, in play", template: "%s · Simplayz" },
  description: "Simplayz is your OpenStreetMap world simulator — build player areas, shape buildings, and run your AI management crew.",
};

export const viewport: Viewport = { themeColor: "#f2f0e6" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
