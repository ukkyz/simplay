import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WORLD } from "./data";
import type { ActivityEntry, Area, Bot, Building, Room, WorldState } from "./types";

const STORAGE_KEY = "simplayz.world.v1";

export interface Toast {
  id: number;
  message: string;
  detail?: string;
  tone: "lime" | "coral" | "sky" | "neutral";
}

interface SimplayzContextValue {
  world: WorldState;
  addRoom: (areaId: string, buildingId: string, room: Room) => void;
  replaceRooms: (areaId: string, buildingId: string, rooms: Room[]) => void;
  addBuilding: (areaId: string, building: Building) => void;
  updateBot: (botId: Bot["id"], patch: Partial<Bot>) => void;
  setRule: (key: keyof WorldState["routingRules"], value: boolean) => void;
  addActivity: (entry: Omit<ActivityEntry, "id" | "time">) => void;
  resetWorld: () => void;
  toasts: Toast[];
  notify: (message: string, detail?: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

const SimplayzContext = createContext<SimplayzContextValue | null>(null);

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function loadWorld(): WorldState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(WORLD);
    const parsed = JSON.parse(raw) as WorldState;
    if (!Array.isArray(parsed.areas) || !Array.isArray(parsed.bots)) return clone(WORLD);
    return parsed;
  } catch {
    return clone(WORLD);
  }
}

let activityCounter = 0;

export function SimplayzProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<WorldState>(loadWorld);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
    } catch {
      // Persistence is a convenience; the simulation still works without it.
    }
  }, [world]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setWorld(loadWorld());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, detail?: string, tone: Toast["tone"] = "neutral") => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((current) => [...current.slice(-2), { id, message, detail, tone }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4600);
    },
    [],
  );

  const addActivity = useCallback((entry: Omit<ActivityEntry, "id" | "time">) => {
    activityCounter += 1;
    setWorld((current) => ({
      ...current,
      activity: [
        {
          ...entry,
          id: `a-${Date.now()}-${activityCounter}`,
          time: "Just now",
        },
        ...current.activity,
      ].slice(0, 12),
    }));
  }, []);

  const addRoom = useCallback((areaId: string, buildingId: string, newRoom: Room) => {
    setWorld((current) => ({
      ...current,
      areas: current.areas.map((area) =>
        area.id !== areaId
          ? area
          : {
              ...area,
              buildings: area.buildings.map((building) =>
                building.id !== buildingId
                  ? building
                  : {
                      ...building,
                      rooms: [...building.rooms, newRoom],
                      metrics: {
                        ...building.metrics,
                        efficiency: Math.min(99, building.metrics.efficiency + 1),
                      },
                    },
              ),
            },
      ),
    }));
  }, []);

  const replaceRooms = useCallback((areaId: string, buildingId: string, rooms: Room[]) => {
    setWorld((current) => ({
      ...current,
      areas: current.areas.map((area) =>
        area.id !== areaId
          ? area
          : {
              ...area,
              buildings: area.buildings.map((building) =>
                building.id !== buildingId ? building : { ...building, rooms },
              ),
            },
      ),
    }));
  }, []);

  const addBuilding = useCallback((areaId: string, building: Building) => {
    setWorld((current) => ({
      ...current,
      areas: current.areas.map((area) =>
        area.id === areaId ? { ...area, buildings: [...area.buildings, building] } : area,
      ),
    }));
  }, []);

  const updateBot = useCallback((botId: Bot["id"], patch: Partial<Bot>) => {
    setWorld((current) => ({
      ...current,
      bots: current.bots.map((bot) => (bot.id === botId ? { ...bot, ...patch } : bot)),
    }));
  }, []);

  const setRule = useCallback((key: keyof WorldState["routingRules"], value: boolean) => {
    setWorld((current) => ({
      ...current,
      routingRules: { ...current.routingRules, [key]: value },
    }));
  }, []);

  const resetWorld = useCallback(() => {
    setWorld(clone(WORLD));
    notify("World reset", "The demo state has been restored.", "lime");
  }, [notify]);

  const value = useMemo<SimplayzContextValue>(
    () => ({
      world,
      addRoom,
      replaceRooms,
      addBuilding,
      updateBot,
      setRule,
      addActivity,
      resetWorld,
      toasts,
      notify,
      dismissToast,
    }),
    [world, addRoom, replaceRooms, addBuilding, updateBot, setRule, addActivity, resetWorld, toasts, notify, dismissToast],
  );

  return <SimplayzContext.Provider value={value}>{children}</SimplayzContext.Provider>;
}

export function useSimplayz() {
  const context = useContext(SimplayzContext);
  if (!context) throw new Error("useSimplayz must be used inside SimplayzProvider");
  return context;
}

export const findArea = (areas: Area[], areaId: string): Area | undefined =>
  areas.find((area) => area.id === areaId);

export const findBuilding = (
  areas: Area[],
  areaId: string,
  buildingId: string,
): Building | undefined => findArea(areas, areaId)?.buildings.find((b) => b.id === buildingId);
