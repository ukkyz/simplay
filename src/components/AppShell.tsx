"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LayoutGrid,
  LifeBuoy,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "@/lib/router";
import { useSimplayz } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Avatar, BotAvatar, Wordmark } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = usePathname();
  const { world, player, execute, isSaving, notify } = useSimplayz();
  const root = `/user/${player.id}`;
  const primaryArea = world.areas[0];
  const primaryBuilding = primaryArea?.buildings[0];
  const areaHref = primaryArea ? `${root}/area/${primaryArea.id}` : "/";
  const buildingHref = primaryBuilding ? `${areaHref}/building/${primaryBuilding.id}` : areaHref;
  const aiHref = `${root}/ai/management`;
  const navItems = [
    { key: "world", label: "World map", icon: Globe2, href: "/" },
    { key: "area", label: "My areas", icon: MapIcon, href: areaHref },
    { key: "building", label: "Building sites", icon: Building2, href: buildingHref },
    { key: "ai", label: "AI management", icon: Sparkles, href: aiHref },
  ] as const;
  const active = pathname === "/" ? "world"
    : pathname === aiHref ? "ai"
    : pathname.startsWith(`${root}/area/`) ? (pathname.includes("/building/") ? "building" : "area") : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const onlineBots = world.bots.filter((bot) => bot.status === "online").length;

  return (
    <div className="min-h-svh bg-bone">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-line/80 bg-bone/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1560px] items-center justify-between gap-4 px-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Simplayz home"
              className="rounded-lg transition-opacity hover:opacity-80"
            >
              <span className="hidden sm:inline-flex">
                <Wordmark />
              </span>
              <span className="inline-flex sm:hidden">
                <Wordmark compact />
              </span>
            </button>
            <div className="hidden h-6 w-px bg-line lg:block" />
            <span className="hidden items-center gap-2 text-[10.5px] font-semibold text-muted lg:flex">
              <span className="relative flex h-1.5 w-1.5 text-lime-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-40" />
              </span>
              Rotterdam grid is live
            </span>
          </div>

          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-paper/80 p-1 shadow-[0_2px_8px_-4px_rgba(23,32,25,.2)] md:flex"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-all",
                    isActive
                      ? "bg-ink text-paper shadow-sm"
                      : "text-muted hover:bg-ink/[.055] hover:text-ink",
                  )}
                >
                  <Icon size={13} strokeWidth={2} className={isActive ? "text-lime" : ""} />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.label.split(" ")[0]}</span>
                  {isActive && <span className="ml-0.5 h-1 w-1 rounded-full bg-lime" />}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => navigate(aiHref)}
              className="hidden items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 transition-colors hover:border-line-strong xl:flex"
            >
              <span className="flex -space-x-1.5">
                {world.bots.slice(0, 3).map((bot) => (
                  <BotAvatar key={bot.id} bot={bot} size={24} />
                ))}
              </span>
              <span className="text-left leading-none">
                <span className="block text-[10px] font-bold text-ink">AI crew</span>
                <span className="mt-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[.03em] text-muted">
                  <span className="h-1 w-1 rounded-full bg-lime-deep" />
                  {onlineBots}/3 online
                </span>
              </span>
            </button>

            <button
              type="button"
              aria-label="Notifications"
              onClick={() =>
                notify("You're all caught up", "3 room upgrades landed while you were away.", "lime")
              }
              className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-ink/65 transition-colors hover:text-ink"
            >
              <Bell size={15} />
              <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full border border-paper bg-coral" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={`${player.name} profile`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-1.5 transition-colors hover:border-line-strong sm:pr-2.5"
              >
                <span className="relative">
                  <Avatar initials={player.initials} color="#172019" size={30} label={player.name} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-lime-deep" />
                </span>
                <span className="hidden text-left leading-none sm:block">
                  <span className="block text-[10.5px] font-bold text-ink">{player.name}</span>
                  <span className="mt-1 block font-mono text-[8px] uppercase tracking-[.04em] text-muted">
                    Lvl {player.level} · Player
                  </span>
                </span>
                <ChevronDown size={12} className="hidden text-muted sm:block" />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-[256px] overflow-hidden rounded-[18px] border border-line bg-paper p-2 shadow-float animate-pop"
                  >
                    <div className="flex items-center gap-3 rounded-xl bg-bone/60 p-2.5">
                      <Avatar initials={player.initials} color="#172019" size={36} />
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-bold">{player.name}</div>
                        <div className="truncate font-mono text-[9px] text-muted">{player.handle}</div>
                      </div>
                    </div>
                    <div className="my-1.5 h-px bg-line" />
                    {[
                      { label: "World map", icon: Globe2, href: "/" },
                      { label: "My primary area", icon: LayoutGrid, href: areaHref },
                      { label: "AI management", icon: Bot, href: aiHref },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            navigate(item.href);
                            setMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11.5px] font-medium text-ink/80 transition-colors hover:bg-ink/[.05] hover:text-ink"
                        >
                          <Icon size={14} className="text-muted" />
                          {item.label}
                        </button>
                      );
                    })}
                    <div className="my-1.5 h-px bg-line" />
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isSaving}
                      onClick={async () => {
                        if (!window.confirm("Reset the shared demo world? Saved edits will be replaced by the starter data.")) return;
                        setMenuOpen(false);
                        if (await execute({ type: "reset" })) notify("World reset", "The starter data has been restored.", "lime");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11.5px] font-medium text-muted transition-colors hover:bg-ink/[.05] hover:text-ink"
                    >
                      <RotateCcw size={14} />
                      Reset simulation
                    </button>
                    <div className="flex items-center gap-2 px-2.5 pb-1 pt-2 font-mono text-[8px] uppercase tracking-[.05em] text-muted-light">
                      <LifeBuoy size={11} />
                      Simplayz build 0.16.4
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[8.5px] font-bold transition-colors",
                  isActive ? "text-ink" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-10 place-items-center rounded-full transition-colors",
                    isActive ? "bg-lime" : "bg-transparent",
                  )}
                >
                  <Icon size={16} />
                </span>
                {item.key === "area" ? "Areas" : item.key === "building" ? "Sites" : item.key === "ai" ? "AI crew" : "World"}
              </button>
            );
          })}
        </div>
      </nav>

      <ToastStack />
    </div>
  );
}

export function ToastStack() {
  const { toasts, dismissToast } = useSimplayz();
  const tones = {
    lime: { bg: "bg-lime", text: "text-ink", Icon: CheckCircle2 },
    coral: { bg: "bg-coral-soft", text: "text-[#9b4a2c]", Icon: Sparkles },
    sky: { bg: "bg-sky-soft", text: "text-[#3c6783]", Icon: Sparkles },
    neutral: { bg: "bg-ink", text: "text-lime", Icon: Sparkles },
  } as const;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-[78px] right-3 z-[90] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 md:bottom-5 md:right-5"
    >
      {toasts.map((toast) => {
        const tone = tones[toast.tone];
        const Icon = tone.Icon;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-[16px] border border-line bg-paper/97 p-3 shadow-float backdrop-blur animate-pop"
          >
            <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", tone.bg, tone.text)}>
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-bold leading-tight text-ink">{toast.message}</div>
              {toast.detail && <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{toast.detail}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="-mr-0.5 -mt-0.5 grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-bone hover:text-ink"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function PageFooter() {
  return (
    <footer className="mx-auto flex max-w-[1560px] flex-col gap-2 px-4 pb-24 pt-5 text-[9.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 md:pb-6 lg:px-8">
      <span className="flex items-center gap-2 font-medium">
        <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-ink text-lime">
          <span className="font-display text-[8px] font-bold">s</span>
        </span>
        Simplayz · open worlds, one plot at a time
      </span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[8px] uppercase tracking-[.06em] text-muted-light">
        <span>Map data © OpenStreetMap contributors</span>
        <span className="hidden h-3 w-px bg-line sm:block" />
        <span>WebGL 2 · target 60 fps</span>
        <span className="hidden h-3 w-px bg-line sm:block" />
        <span>v0.16.4</span>
      </span>
    </footer>
  );
}
