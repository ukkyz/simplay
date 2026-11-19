"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PlayerSnapshot } from "./types";
import type { WorldCommand, WorldCommandResult } from "./world-commands";

export interface Toast {
  id: number;
  message: string;
  detail?: string;
  tone: "lime" | "coral" | "sky" | "neutral";
}

interface SimplayzContextValue extends PlayerSnapshot {
  execute: (command: WorldCommand) => Promise<WorldCommandResult | null>;
  isSaving: boolean;
  toasts: Toast[];
  notify: (message: string, detail?: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

const SimplayzContext = createContext<SimplayzContextValue | null>(null);

export function SimplayzProvider({ children, initial }: { children: ReactNode; initial: PlayerSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const timers = useRef(new Set<number>());

  const receive = useCallback((next: PlayerSnapshot) => {
    setSnapshot((current) => next.revision > current.revision ? next : current);
  }, []);

  useEffect(() => receive(initial), [initial, receive]);
  useEffect(() => {
    // Separate browser sessions share the same demo world. Refresh on focus,
    // without polling or allowing a stale response to overwrite a newer one.
    let request: AbortController | undefined;
    const refresh = async () => {
      request?.abort();
      request = new AbortController();
      try {
        const response = await fetch("/api/world", { signal: request.signal, cache: "no-store" });
        if (response.ok) receive(await response.json() as PlayerSnapshot);
      } catch {
        // Keep the last acknowledged state when a background refresh fails.
      }
    };
    window.addEventListener("focus", refresh);
    return () => {
      request?.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [receive]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const notify = useCallback((message: string, detail?: string, tone: Toast["tone"] = "neutral") => {
    const id = ++toastId.current;
    setToasts((current) => [...current.slice(-2), { id, message, detail, tone }]);
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      dismissToast(id);
    }, 4600);
    timers.current.add(timer);
  }, [dismissToast]);
  useEffect(() => {
    const active = timers.current;
    return () => { for (const timer of active) window.clearTimeout(timer); };
  }, []);

  const execute = useCallback(async (command: WorldCommand) => {
    if (saving.current) return null;
    saving.current = true;
    setIsSaving(true);
    try {
      const response = await fetch("/api/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        notify("Changes not saved", body?.error ?? "Refresh the world and try again.", "coral");
        return null;
      }
      const result = await response.json() as WorldCommandResult;
      receive(result.snapshot);
      return result;
    } catch {
      notify("Could not confirm the save", "Check your connection and reload the world before retrying.", "coral");
      return null;
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }, [notify, receive]);

  const value = useMemo(() => ({
    ...snapshot, execute, isSaving, toasts, notify, dismissToast,
  }), [snapshot, execute, isSaving, toasts, notify, dismissToast]);

  return <SimplayzContext.Provider value={value}>{children}</SimplayzContext.Provider>;
}

export function useSimplayz() {
  const context = useContext(SimplayzContext);
  if (!context) throw new Error("useSimplayz must be used inside SimplayzProvider");
  return context;
}
