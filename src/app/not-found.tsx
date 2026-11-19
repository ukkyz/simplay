import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { requireAccount } from "@/auth/server";

export default async function NotFound() {
  await requireAccount();
  return (
    <main className="mx-auto flex min-h-[76svh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-paper text-muted">
        <Compass size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[.15em] text-muted">Error 404 · off the plot</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.05em]">This path isn&apos;t paved yet.</h1>
      <p className="mt-2 max-w-[46ch] text-[12px] leading-relaxed text-muted">
        This page is outside your surveyed world. Head back to the world map to keep exploring.
      </p>
      <Link href="/" className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12.5px] font-semibold text-paper hover:bg-ink-soft">
        <ArrowLeft size={14} aria-hidden="true" /> World map
      </Link>
    </main>
  );
}
