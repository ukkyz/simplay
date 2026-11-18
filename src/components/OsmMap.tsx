import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Crosshair, Minus, Plus, Trees } from "lucide-react";
import type { LatLng } from "@/lib/types";
import { cn } from "@/utils/cn";
import { IconButton } from "./ui";

const TILE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: "area" | "player" | "building" | "dot";
  label: string;
  sublabel?: string;
  active?: boolean;
  tone?: "lime" | "coral" | "sky" | "violet" | "ink";
  initials?: string;
  avatarColor?: string;
  level?: number;
  onClick?: () => void;
}

const TONE: Record<NonNullable<MapMarker["tone"]>, string> = {
  lime: "#b5e84d",
  coral: "#ef8868",
  sky: "#9dc7e5",
  violet: "#c7b8ea",
  ink: "#172019",
};

const worldSize = (zoom: number) => TILE * Math.pow(2, zoom);

function project(point: LatLng, zoom: number) {
  const size = worldSize(zoom);
  const sin = Math.sin((point.lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

function unproject(x: number, y: number, zoom: number): LatLng {
  const size = worldSize(zoom);
  const lng = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat: Math.max(-84, Math.min(84, lat)), lng: ((lng + 540) % 360) - 180 };
}

interface OsmMapProps {
  center: LatLng;
  zoom: number;
  markers?: MapMarker[];
  polygon?: LatLng[];
  className?: string;
  overlay?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  interactive?: boolean;
  showControls?: boolean;
  showAttribution?: boolean;
  ariaLabel?: string;
  onViewChange?: (view: { lat: number; lng: number; zoom: number }) => void;
}

export function OsmMap({
  center,
  zoom,
  markers = [],
  polygon,
  className,
  overlay,
  footer,
  compact = false,
  interactive = true,
  showControls = true,
  showAttribution = true,
  ariaLabel = "OpenStreetMap view",
  onViewChange,
}: OsmMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 480 });
  const [view, setView] = useState({ lat: center.lat, lng: center.lng, zoom });
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  const drag = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    centerWorld: { x: number; y: number };
  }>({ active: false, moved: false, startX: 0, startY: 0, centerWorld: { x: 0, y: 0 } });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setView({ lat: center.lat, lng: center.lng, zoom });
  }, [center.lat, center.lng, zoom]);



  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = () => {
      const box = node.getBoundingClientRect();
      if (box.width && box.height) setSize({ width: box.width, height: box.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const emit = useCallback((next: { lat: number; lng: number; zoom: number }) => {
    setView(next);
    onViewChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !interactive) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setView((current) => {
        const step = event.deltaY > 0 ? -1 : 1;
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + step));
        if (nextZoom === current.zoom) return current;
        const next = { ...current, zoom: nextZoom };
        onViewChangeRef.current?.(next);
        return next;
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [interactive, size.width, size.height]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      centerWorld: project(view, view.zoom),
    };
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    const nextCenter = unproject(
      drag.current.centerWorld.x - dx,
      drag.current.centerWorld.y - dy,
      view.zoom,
    );
    setView((current) => ({ ...current, lat: nextCenter.lat, lng: nextCenter.lng }));
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    setView((current) => {
      onViewChangeRef.current?.({ lat: current.lat, lng: current.lng, zoom: current.zoom });
      return current;
    });
  };

  const zoomBy = (delta: number) => {
    setView((current) => {
      const next = {
        ...current,
        zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + delta)),
      };
      onViewChangeRef.current?.(next);
      return next;
    });
  };

  const centerPoint = project(view, view.zoom);

  const tiles = useMemo(() => {
    const maxIndex = Math.pow(2, view.zoom);
    const tileCount = Math.ceil(Math.max(size.width, size.height) / TILE);
    const rawStartX = Math.floor((centerPoint.x - size.width / 2) / TILE) - 1;
    const rawEndX = Math.floor((centerPoint.x + size.width / 2) / TILE) + 1;
    const startY = Math.max(0, Math.floor((centerPoint.y - size.height / 2) / TILE) - 1);
    const endY = Math.min(maxIndex - 1, Math.floor((centerPoint.y + size.height / 2) / TILE) + 1);
    const startX = Math.max(rawStartX, Math.floor(centerPoint.x / TILE) - tileCount - 2);
    const endX = Math.min(rawEndX, Math.floor(centerPoint.x / TILE) + tileCount + 2);
    const result: Array<{
      key: string;
      src: string;
      left: number;
      top: number;
    }> = [];
    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
        result.push({
          key: `${view.zoom}-${x}-${y}`,
          src: `https://tile.openstreetmap.org/${view.zoom}/${wrappedX}/${y}.png`,
          left: x * TILE - (centerPoint.x - size.width / 2),
          top: y * TILE - (centerPoint.y - size.height / 2),
        });
      }
    }
    return result;
  }, [centerPoint.x, centerPoint.y, size.width, size.height, view.zoom]);

  const polygonPoints = useMemo(() => {
    if (!polygon) return "";
    return polygon
      .map((point) => {
        const projected = project(point, view.zoom);
        return `${(projected.x - centerPoint.x + size.width / 2).toFixed(1)},${(projected.y - centerPoint.y + size.height / 2).toFixed(1)}`;
      })
      .join(" ");
  }, [polygon, centerPoint.x, centerPoint.y, size.width, size.height, view.zoom]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={ariaLabel}
      className={cn(
        "osm-canvas group relative select-none overflow-hidden",
        interactive && "map-grab",
        dragging && "cursor-grabbing",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="absolute inset-0 overflow-hidden bg-[#e7e4d8]">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            loading="eager"
            decoding="async"
            className="osm-tile pointer-events-none absolute max-w-none"
            style={{ left: tile.left, top: tile.top, width: TILE, height: TILE }}
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
        ))}
      </div>
      <div className="osm-tint pointer-events-none absolute inset-0" />

      {polygon && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <pattern id="lot-hatch" width="8" height="8" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#b5e84d" strokeOpacity=".45" strokeWidth="1.5" />
            </pattern>
          </defs>
          <polygon points={polygonPoints} fill="url(#lot-hatch)" opacity="0.7" />
          <polygon
            points={polygonPoints}
            fill="#c9f95f"
            fillOpacity="0.1"
            stroke="#5d7a23"
            strokeWidth="1.8"
            strokeDasharray="6 5"
            strokeLinejoin="round"
          />
          {polygonPoints.split(" ").map((point, index) => {
            const [x, y] = point.split(",");
            return (
              <rect
                key={`${point}-${index}`}
                x={Number(x) - 3}
                y={Number(y) - 3}
                width="6"
                height="6"
                rx="1"
                fill="#fbfaf4"
                stroke="#5d7a23"
                strokeWidth="1.4"
              />
            );
          })}
        </svg>
      )}

      {markers.map((marker) => {
        const projected = project({ lat: marker.lat, lng: marker.lng }, view.zoom);
        const left = projected.x - centerPoint.x + size.width / 2;
        const top = projected.y - centerPoint.y + size.height / 2;
        const hidden = left < -130 || left > size.width + 130 || top < -100 || top > size.height + 100;
        if (hidden) return null;
        const color = TONE[marker.tone ?? "lime"];

        if (marker.kind === "player") {
          return (
            <button
              key={marker.id}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                marker.onClick?.();
              }}
              title={marker.label}
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left, top }}
            >
              <span className="relative grid place-items-center">
                <span
                  className="absolute h-10 w-10 rounded-full border-2 border-white/80"
                  style={{ background: `${marker.avatarColor ?? "#172019"}33` }}
                />
                <span
                  className="relative grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-paper font-display text-[10px] font-bold text-white shadow-md"
                  style={{ background: marker.avatarColor ?? color }}
                >
                  {marker.initials ?? "P"}
                </span>
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-paper"
                  style={{ background: color }}
                />
              </span>
              <span className="whitespace-nowrap rounded-full bg-ink/90 px-2 py-[3px] text-[9px] font-bold tracking-wide text-paper shadow-sm backdrop-blur">
                {marker.label}
              </span>
            </button>
          );
        }

        if (marker.kind === "dot") {
          return (
            <button
              key={marker.id}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                marker.onClick?.();
              }}
              className="absolute z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper"
              style={{ left, top, background: color }}
              title={marker.label}
              aria-label={marker.label}
            />
          );
        }

        if (marker.kind === "building") {
          return (
            <button
              key={marker.id}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                marker.onClick?.();
              }}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-line bg-paper/95 py-1 pl-1 pr-2.5 text-[10px] font-semibold text-ink shadow-md backdrop-blur transition-transform hover:scale-[1.03]"
              style={{ left, top }}
              title={marker.label}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: color }}>
                <Building2 size={10} />
              </span>
              {marker.label}
            </button>
          );
        }

        return (
          <button
            key={marker.id}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              marker.onClick?.();
            }}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-full group/marker flex flex-col items-center text-left transition-transform duration-200 hover:z-30 hover:-translate-y-[calc(100%+2px)]",
              marker.active && "z-30",
            )}
            style={{ left, top }}
            aria-label={`${marker.label}${marker.sublabel ? `, ${marker.sublabel}` : ""}`}
          >
            <span
              className={cn(
                "flex items-center gap-2 rounded-[12px] border bg-paper/95 py-1.5 pl-1.5 pr-3 shadow-[0_6px_20px_-8px_rgba(23,32,25,.4)] backdrop-blur-md",
                marker.active ? "border-ink ring-2 ring-lime/60" : "border-line",
              )}
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-[8px] text-ink"
                style={{ background: color }}
              >
                <Trees size={14} />
              </span>
              <span className="leading-none">
                <span className="block whitespace-nowrap text-[11.5px] font-bold tracking-[-0.02em] text-ink">
                  {marker.label}
                </span>
                {marker.sublabel && (
                  <span className="mt-1 block whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.04em] text-muted">
                    {marker.sublabel}
                  </span>
                )}
              </span>
              {marker.level !== undefined && (
                <span className="ml-1 rounded-full bg-ink px-1.5 py-0.5 font-mono text-[8px] font-medium text-lime">
                  L{marker.level}
                </span>
              )}
            </span>
            <span
              className="h-2.5 w-2.5 -translate-y-1 rotate-45 border-b border-r bg-paper"
              style={{ borderColor: marker.active ? "#172019" : "#dddccf" }}
            />
          </button>
        );
      })}

      {overlay}

      {showControls && (
        <div
          className="absolute bottom-3 right-3 z-30 flex flex-col overflow-hidden rounded-full border border-line bg-paper/95 shadow-md backdrop-blur"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <IconButton label="Zoom in" onClick={() => zoomBy(1)} className="rounded-none">
            <Plus size={14} />
          </IconButton>
          <span className="mx-2 h-px bg-line" />
          <IconButton label="Zoom out" onClick={() => zoomBy(-1)} className="rounded-none">
            <Minus size={14} />
          </IconButton>
          <span className="mx-2 h-px bg-line" />
          <IconButton
            label="Recenter map"
            onClick={() => emit({ lat: center.lat, lng: center.lng, zoom })}
            className="rounded-none"
          >
            <Crosshair size={13} />
          </IconButton>
        </div>
      )}

      {showAttribution && (
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute bottom-2 left-2 z-30 rounded bg-paper/80 px-1.5 py-0.5 text-[8px] font-medium text-ink/60 backdrop-blur-sm hover:text-ink"
        >
          © OpenStreetMap
        </a>
      )}

      {!compact && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-line bg-paper/90 px-2 py-1 text-[9px] font-semibold text-muted shadow-sm backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
          OSM · live
        </div>
      )}

      {footer}
    </div>
  );
}
