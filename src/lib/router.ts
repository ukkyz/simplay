import { useEffect, useState } from "react";

export type Route =
  | { name: "world"; path: "/" }
  | { name: "area"; path: string; userId: string; areaId: string }
  | { name: "building"; path: string; userId: string; areaId: string; buildingId: string }
  | { name: "ai"; path: string; userId: string }
  | { name: "notfound"; path: string };

export function parseRoute(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return { name: "world", path: "/" };
  const parts = clean.split("/").filter(Boolean);
  if (parts[0] === "user" && parts[1]) {
    const userId = parts[1];
    if (parts[2] === "area" && parts[3] && parts.length === 4) {
      return { name: "area", path: clean, userId, areaId: parts[3] };
    }
    if (parts[2] === "area" && parts[3] && parts[4] === "building" && parts[5] && parts.length === 6) {
      return { name: "building", path: clean, userId, areaId: parts[3], buildingId: parts[5] };
    }
    if (parts[2] === "ai" && parts[3] === "management" && parts.length === 4) {
      return { name: "ai", path: clean, userId };
    }
  }
  return { name: "notfound", path: clean };
}

export function navigate(to: string) {
  if (window.location.pathname === to) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" });
}

let currentKey = window.location.pathname;

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  useEffect(() => {
    const onChange = () => {
      currentKey = window.location.pathname;
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  if (currentKey !== window.location.pathname) {
    currentKey = window.location.pathname;
    return parseRoute(currentKey);
  }
  return route;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Simplayz`;
  }, [title]);
}
