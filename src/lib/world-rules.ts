import type { Room } from "./types";

export const BUILDING_CATEGORIES = [
  { id: "studio", label: "Innovation studio", accent: "#cf6d47", soft: "#f8e4d9", roof: "#b8563a" },
  { id: "social", label: "Social club", accent: "#5c8ca4", soft: "#e1edf2", roof: "#3f6f86" },
  { id: "garden", label: "Community garden", accent: "#6f9a4f", soft: "#e6efdb", roof: "#4f7d56" },
  { id: "residence", label: "Residential co-op", accent: "#a8834e", soft: "#f2e8d5", roof: "#8c6c3e" },
  { id: "workshop", label: "Workshop", accent: "#9d83c2", soft: "#ece4f6", roof: "#8066a5" },
] as const;

export const BUILDING_SLOTS = [
  { x: 14, y: 10, w: 7, h: 5 },
  { x: 2, y: 10, w: 8, h: 5 },
  { x: 13, y: 2, w: 8, h: 6 },
];

export const MIN_ROOM_AREA = 8;
export const MAX_ROOM_AREA = 180;

export function maxCarvedArea(source: Room) {
  return Math.min(MAX_ROOM_AREA, source.area - MIN_ROOM_AREA);
}

export function splitFootprint(room: Room) {
  const { x, y, w, h } = room;
  if (Math.max(w, h) < 6 || maxCarvedArea(room) < MIN_ROOM_AREA) return null;
  if (w >= h) {
    const width = Math.floor(w / 2);
    return {
      horizontal: true,
      rest: { x, y, w: w - width, h },
      created: { x: x + w - width, y, w: width, h },
    };
  }
  const height = Math.floor(h / 2);
  return {
    horizontal: false,
    rest: { x, y, w, h: h - height },
    created: { x, y: y + h - height, w, h: height },
  };
}
