import { useId } from "react";
import { ArrowUpRight, DoorOpen, ShieldCheck, UserRound } from "lucide-react";
import type { Area, Building } from "@/lib/types";
import { ROOM_STYLES } from "@/lib/data";
import { cn } from "@/utils/cn";

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function AreaPlan({
  area,
  selectedId,
  onSelect,
  onOpen,
  className,
}: {
  area: Area;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  className?: string;
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const trees = [
    [62, 32, 3.2],
    [139, 22, 2.4],
    [225, 50, 3.5],
    [36, 76, 2.6],
    [129, 87, 2.3],
    [218, 101, 2.7],
    [71, 113, 3.1],
    [208, 144, 2.8],
    [34, 158, 2.4],
    [158, 163, 2.2],
    [96, 164, 2.3],
  ];
  return (
    <div className={cn("blueprint relative h-full w-full overflow-hidden", className)}>
      <svg
        viewBox="0 0 240 170"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="group"
        aria-label={`${area.name} layout plan`}
      >
        <defs>
          <pattern id={`${id}-lotgrid`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(23,32,25,.08)" strokeWidth=".4" />
          </pattern>
          <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="1.2" floodColor="#172019" floodOpacity=".2" />
          </filter>
          <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dce7cb" />
            <stop offset="100%" stopColor="#cedcbb" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="240" height="170" fill="#f2f0e5" />
        <rect x="6" y="6" width="228" height="158" rx="6" fill={`url(#${id}-grass)`} stroke="#a7b68c" strokeWidth=".8" />
        <rect x="6" y="6" width="228" height="158" rx="6" fill={`url(#${id}-lotgrid)`} />

        <path d="M11 88 H229" stroke="#f7f4e9" strokeWidth="7" strokeLinecap="round" />
        <path d="M11 88 H229" stroke="#c6c4b4" strokeWidth=".8" strokeDasharray="3 4" />
        <path d="M119 11 V159" stroke="#f7f4e9" strokeWidth="6" strokeLinecap="round" />
        <path d="M119 11 V159" stroke="#c6c4b4" strokeWidth=".8" strokeDasharray="3 4" />
        <path d="M42 150 C72 132 92 128 119 112" fill="none" stroke="#f7f4e9" strokeWidth="4" strokeLinecap="round" />
        <path d="M153 30 C164 54 166 72 184 92" fill="none" stroke="#f7f4e9" strokeWidth="4" strokeLinecap="round" />

        {area.buildings.map((building) => {
          const selected = building.id === selectedId;
          const x = building.plan.x * 10;
          const y = building.plan.y * 10;
          const w = building.plan.w * 10;
          const h = building.plan.h * 10;
          return (
            <g
              key={building.id}
              onClick={() => {
                onSelect?.(building.id);
              }}
              onDoubleClick={() => onOpen?.(building.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${building.name}, ${building.category}. Double click to open building site.`}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSelect?.(building.id);
                if (event.key === " ") onOpen?.(building.id);
              }}
            >
              <rect
                x={x + 1.4}
                y={y + 2.2}
                width={w - 2.8}
                height={h - 2.8}
                rx="2"
                fill="#50603f"
                opacity=".18"
              />
              <rect
                x={x + 1}
                y={y + 1}
                width={w - 2}
                height={h - 2}
                rx="2"
                fill={building.accentSoft}
                stroke={selected ? "#172019" : building.accent}
                strokeWidth={selected ? 1.4 : 0.7}
                filter={`url(#${id}-shadow)`}
              />
              <rect
                x={x + 4}
                y={y + 4}
                width={w - 8}
                height={h - 8}
                rx="1.2"
                fill="none"
                stroke={building.accent}
                strokeWidth=".4"
                strokeDasharray="2 2"
                opacity=".8"
              />
              <rect
                x={x + w - 15}
                y={y + 4.5}
                width="9"
                height="3.5"
                rx="1.75"
                fill={building.accent}
                opacity=".5"
              />
              <rect x={x + w / 2 - 4} y={y + h - 6.5} width="8" height="2.8" rx="1" fill={building.roof} />
              <text
                x={x + 5}
                y={y + 12}
                fontFamily="Manrope, sans-serif"
                fontSize="4.4"
                fontWeight="800"
                fill="#172019"
                letterSpacing="-.05"
              >
                {truncate(building.name, Math.max(8, Math.floor((w - 8) / 2.55)))}
              </text>
              <text
                x={x + 5}
                y={y + 17}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="2.8"
                fontWeight="500"
                fill="#172019"
                opacity=".5"
                letterSpacing=".04"
              >
                {building.rooms.length} ROOMS · L{building.level}
              </text>
              <g transform={`translate(${x + 5}, ${y + h - 10})`} opacity=".7">
                <circle cx="1.6" cy="-1" r="1" fill={building.accent} />
                <text x="4.5" y="0.3" fontFamily="'JetBrains Mono', monospace" fontSize="2.6" fill="#172019" opacity=".65">
                  {building.metrics.efficiency}% EFF
                </text>
              </g>
              {selected && (
                <g>
                  <rect
                    x={x - 1}
                    y={y - 1}
                    width={w + 2}
                    height={h + 2}
                    rx="3"
                    fill="none"
                    stroke="#a5dc3e"
                    strokeWidth="1.6"
                  />
                  <circle cx={x + w - 5} cy={y + h - 5} r="2.4" fill="#c9f95f" stroke="#172019" strokeWidth=".7" />
                </g>
              )}
            </g>
          );
        })}

        {trees.map(([x, y, r], index) => (
          <g key={`tree-${index}`} opacity=".9">
            <circle cx={x} cy={y + 1} r={r} fill="#50613f" opacity=".16" />
            <circle cx={x - 1} cy={y} r={r} fill="#93ad6d" />
            <circle cx={x + r * 0.55} cy={y + r * 0.15} r={r * 0.72} fill="#7f9b59" />
            <circle cx={x - r * 0.25} cy={y - r * 0.4} r={r * 0.58} fill="#a8bc80" />
          </g>
        ))}

        <g transform="translate(11, 21)">
          <rect x="-2" y="-8" width="34" height="10" rx="2" fill="#fbfaf4" opacity=".92" stroke="#c9c8ba" strokeWidth=".4" />
          <text x="2" y="-1.5" fontFamily="'JetBrains Mono', monospace" fontSize="3" fontWeight="600" fill="#172019" letterSpacing=".06">
            {area.lotCode}
          </text>
        </g>

        <g transform="translate(209, 148)">
          <circle r="10" fill="#fbfaf4" opacity=".85" stroke="#c9c8ba" strokeWidth=".4" />
          <path d="M0 -6 L2.6 2.4 L0 1.2 L-2.6 2.4Z" fill="#172019" />
          <text x="0" y="7" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="2.8" fontWeight="800" fill="#172019">
            N
          </text>
        </g>

        <g transform="translate(13, 156)">
          <path d="M0 0 H14" stroke="#172019" strokeWidth=".8" />
          <path d="M0 -1.4 V1.4 M7 -1 V1 M14 -1.4 V1.4" stroke="#172019" strokeWidth=".6" />
          <text x="0" y="5" fontFamily="'JetBrains Mono', monospace" fontSize="2.8" fill="#172019" opacity=".55">
            0
          </text>
          <text x="12" y="5" fontFamily="'JetBrains Mono', monospace" fontSize="2.8" fill="#172019" opacity=".55">
            12m
          </text>
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-lg border border-line bg-paper/90 px-2 py-1.5 backdrop-blur sm:left-3">
        <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
        <div>
          <div className="text-[9px] font-bold leading-none text-ink">
            {area.buildings.length} of {Math.max(5, area.buildings.length + 1)} lots built
          </div>
          <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.06em] text-muted">
            Plotted · 1:200 · {area.lotCode}
          </div>
        </div>
      </div>

      <div className="absolute right-2.5 top-2.5 rounded-md border border-line bg-paper/90 px-2 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.08em] text-muted backdrop-blur sm:right-3">
        Layout · top down
      </div>
    </div>
  );
}

export function BuildingPlan({
  building,
  selectedId,
  onSelect,
  className,
}: {
  building: Building;
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const s = 10;
  const offset = { x: 10, y: 12 };
  return (
    <div className={cn("blueprint relative h-full w-full overflow-hidden", className)}>
      <svg
        viewBox="0 0 220 162"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        role="group"
        aria-label={`${building.name} floor plan`}
      >
        <defs>
          <pattern id={`${id}-grid`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(23,32,25,.07)" strokeWidth=".4" />
          </pattern>
          <filter id={`${id}-roomshadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation=".9" floodColor="#172019" floodOpacity=".13" />
          </filter>
        </defs>

        <rect x="0" y="0" width="220" height="162" fill="#f3f1e8" />
        <rect x="7" y="8" width="206" height="146" rx="4" fill={`url(#${id}-grid)`} />

        <g transform={`translate(${offset.x}, ${offset.y})`}>
          <rect
            x={-3}
            y={-3}
            width={200 + 6}
            height={140 + 6}
            rx="3"
            fill="#d8d4c2"
            filter={`url(#${id}-roomshadow)`}
          />
          <rect x="-1.5" y="-1.5" width="203" height="143" rx="2" fill="#efe9db" />

          {building.rooms.map((room) => {
            const style = ROOM_STYLES[room.type];
            const selected = room.id === selectedId;
            const x = room.x * s;
            const y = room.y * s;
            const w = room.w * s;
            const h = room.h * s;
            const furniture = (() => {
              if (room.type === "workspace") {
                return (
                  <g opacity=".55">
                    <rect x={x + 5} y={y + h - 15} width={w * 0.34} height="3" rx=".8" fill="#68745d" />
                    <rect x={x + w * 0.55} y={y + h - 15} width={w * 0.25} height="3" rx=".8" fill="#68745d" />
                    <rect x={x + 6} y={y + h - 19} width="4" height="2" rx=".4" fill="#7f8c72" />
                  </g>
                );
              }
              if (room.type === "social") {
                return (
                  <g opacity=".55">
                    <rect x={x + 5} y={y + h - 14} width={w * 0.4} height="2.5" rx="1" fill="#8e7758" />
                    <circle cx={x + w - 8} cy={y + h - 9} r="2.4" fill="#8e7758" />
                  </g>
                );
              }
              if (room.type === "garden") {
                return (
                  <g opacity=".65">
                    <circle cx={x + w * 0.3} cy={y + h - 9} r="3.2" fill="#70905f" />
                    <circle cx={x + w * 0.48} cy={y + h - 7} r="2.2" fill="#8aa66f" />
                  </g>
                );
              }
              if (room.type === "lobby") {
                return (
                  <g opacity=".6">
                    <path d={`M${x + 5} ${y + h - 12} H${x + w - 6}`} stroke="#8e7758" strokeWidth="2" />
                    <circle cx={x + 7} cy={y + h - 8} r="1.5" fill="#70905f" />
                  </g>
                );
              }
              if (room.type === "security") {
                return (
                  <g opacity=".55">
                    <rect x={x + 5} y={y + h - 11} width={w * 0.3} height="2" rx=".5" fill="#4a6070" />
                    <rect x={x + 5} y={y + h - 7} width="3" height="2" fill="#4a6070" />
                  </g>
                );
              }
              return (
                <g opacity=".5">
                  <rect x={x + 5} y={y + h - 11} width={w * 0.28} height="2" rx=".6" fill="#8e7758" />
                  <circle cx={x + w - 8} cy={y + h - 7} r="1.6" fill="#70905f" />
                </g>
              );
            })();

            const subtitle = `${room.area} m² · ${room.occupants} ${room.occupants === 1 ? "seat" : "seats"}`;
            return (
              <g
                key={room.id}
                className="cursor-pointer"
                onClick={() => onSelect?.(room.id)}
                role="button"
                tabIndex={0}
                aria-label={`${room.name}, ${room.area} square meters`}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSelect?.(room.id);
                }}
              >
                <rect
                  x={x + 0.8}
                  y={y + 0.8}
                  width={w - 1.6}
                  height={h - 1.6}
                  rx="1.4"
                  fill={selected ? "#e8f7c4" : style.soft}
                  stroke={selected ? "#172019" : style.color}
                  strokeOpacity={selected ? 1 : 0.5}
                  strokeWidth={selected ? 1.2 : 0.6}
                />
                {selected && (
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={w - 4}
                    height={h - 4}
                    rx="1"
                    fill="none"
                    stroke="#99cc3c"
                    strokeWidth=".8"
                    strokeDasharray="2 1.5"
                  />
                )}
                <text
                  x={x + 4}
                  y={y + 8.4}
                  fontFamily="Manrope, sans-serif"
                  fontSize={w < 48 ? "3.7" : "4.4"}
                  fontWeight="800"
                  fill="#172019"
                  letterSpacing="-.04"
                >
                  {truncate(room.name, Math.max(7, Math.floor((w - 8) / 2.35)))}
                </text>
                <text
                  x={x + 4}
                  y={y + 13}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="2.6"
                  fontWeight="500"
                  fill="#172019"
                  opacity=".49"
                >
                  {subtitle}
                </text>
                {furniture}
                {room.status === "setup" && (
                  <g transform={`translate(${x + w - 11}, ${y + 4})`}>
                    <circle r="2.2" fill="#fbfaf4" />
                    <circle r="1" fill="#be7f23" />
                  </g>
                )}
                {room.type === "security" && (
                  <g transform={`translate(${x + w - 11}, ${y + h - 6})`} opacity=".8">
                    <circle r="2.1" fill="#4b79a8" />
                    <path d="M-1 0.1 L0 .9 L1.2 -0.7" fill="none" stroke="#fbfaf4" strokeWidth=".7" strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}

          <path d={`M${offset.x + 15} ${offset.y + 140} H${offset.x + 33}`} stroke="#172019" strokeWidth=".7" />
          <path
            d={`M${offset.x + 15} ${offset.y + 138.5} v3 M${offset.x + 24} ${offset.y + 139} v2 M${offset.x + 33} ${offset.y + 138.5} v3`}
            stroke="#172019"
            strokeWidth=".6"
          />
        </g>

        <g transform="translate(197, 16)">
          <circle r="8" fill="#fbfaf4" stroke="#c9c8ba" strokeWidth=".4" />
          <path d="M0 -4.5 L2 2 L0 1 L-2 2Z" fill="#172019" />
        </g>

        <g transform="translate(12, 154)">
          <rect x="0" y="-5" width="72" height="9" rx="1.6" fill="#fbfaf4" stroke="#d8d5c6" strokeWidth=".4" />
          <text x="3.5" y="1.5" fontFamily="Manrope, sans-serif" fontSize="3.4" fontWeight="800" fill="#172019">
            {truncate(building.name, 26)} · F1
          </text>
        </g>
      </svg>

      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-md border border-line bg-paper/90 px-2 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.08em] text-muted backdrop-blur sm:right-3">
        Floor plan · 1:50
      </div>

      <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-2 rounded-lg border border-line bg-paper/90 px-2 py-1.5 backdrop-blur">
        <DoorOpen size={12} className="text-muted" />
        <span className="font-mono text-[7.5px] uppercase tracking-[0.06em] text-muted">
          {building.rooms.length} rooms · {building.rooms.reduce((sum, room) => sum + room.area, 0)} m²
        </span>
      </div>
    </div>
  );
}

export function IsoThumb({ building, className }: { building: Building; className?: string }) {
  const body = building.accent;
  const soft = building.accentSoft;
  const roof = building.roof;
  return (
    <svg viewBox="0 0 220 112" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`thumb-ground-${building.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9edd9" />
          <stop offset="100%" stopColor="#dfe6ce" />
        </linearGradient>
        <filter id={`thumb-shadow-${building.id}`} x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#172019" floodOpacity=".18" />
        </filter>
      </defs>
      <rect width="220" height="112" fill={`url(#thumb-ground-${building.id})`} rx="0" />
      <path d="M0 92 C50 78 140 84 220 70 V112 H0Z" fill="#d7e1c6" />
      <ellipse cx="112" cy="94" rx="66" ry="12" fill="#b9c7a4" opacity=".5" />
      <g filter={`url(#thumb-shadow-${building.id})`}>
        <path d="M44 85 L112 99 L180 83 L112 69Z" fill="#e6e2d2" stroke="#c8c3b2" strokeWidth=".8" />
        <path d="M112 99 L180 83 L180 87 L112 103Z" fill="#c9c2ae" />
        <path d="M112 40 L164 54 L164 83 L112 96Z" fill={body} opacity=".9" />
        <path d="M112 40 L164 54 L164 62 L112 74Z" fill="#ffffff" opacity=".12" />
        <path d="M57 55 L112 40 L112 74 L57 87Z" fill={soft} />
        <path d="M112 40 L164 54 L112 70 L57 55Z" fill={roof} />
        <path d="M66 60 L104 50 M66 68 L104 58 M66 76 L104 66" stroke={body} strokeWidth="2.2" opacity=".5" />
        <path d="M80 79 L94 75 L94 85 L80 89Z" fill="#3d4739" opacity=".6" />
        <path d="M121 50 L153 59 L153 68 L121 59Z" fill="#dcebe1" opacity=".8" stroke="#ffffff" strokeOpacity=".55" />
        <path d="M121 63 L153 72 L153 78 L121 69Z" fill="#dcebe1" opacity=".7" stroke="#ffffff" strokeOpacity=".45" />
        <path d="M148 38 L150 30" stroke="#6a7460" strokeWidth="1.2" />
        <circle cx="150" cy="29" r="1.8" fill="#ef8868" />
        <path d="M42 80 L50 78 L50 84 L42 86Z" fill={body} opacity=".8" />
        <path d="M43 76 L49 74 L49 78 L43 80Z" fill={roof} />
      </g>
      <g>
        <rect x="176" y="75" width="2.5" height="15" rx="1" fill="#87745a" />
        <circle cx="177" cy="70" r="10" fill="#9bb574" />
        <circle cx="184" cy="74" r="7" fill="#84a160" />
        <circle cx="170" cy="76" r="6" fill="#a9bf83" />
      </g>
      <g opacity=".8">
        <rect x="32" y="84" width="2" height="9" rx="1" fill="#87745a" />
        <circle cx="33" cy="80" r="6" fill="#8ca667" />
        <circle cx="28" cy="84" r="4.5" fill="#a2b77b" />
      </g>
      <g transform="translate(13, 15)">
        <rect width="58" height="17" rx="5" fill="#fbfaf4" opacity=".88" />
        <text x="7" y="11" fontFamily="'JetBrains Mono', monospace" fontSize="6" fontWeight="600" fill="#172019" letterSpacing=".05">
          LOD 0–3
        </text>
      </g>
      <g transform="translate(184, 18)">
        <circle r="9" fill="#172019" />
        <path d="M-3 0 H3 M0 -3 V3" stroke="#c9f95f" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function StaffSummary({ building }: { building: Building }) {
  const statusTone = (status: string) =>
    status === "on-duty" ? "bg-lime-deep" : status === "handoff" ? "bg-[#d8a24f]" : "bg-muted-light";
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bone/40 px-2.5 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-lime">
          <ShieldCheck size={13} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-semibold leading-tight text-ink">{building.guard.name}</div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[.05em] text-muted">
            <span className={`h-1 w-1 rounded-full ${statusTone(building.guard.status)}`} />
            Guard · {building.guard.shift}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bone/40 px-2.5 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral-soft text-[#9b4a2c]">
          <UserRound size={13} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-semibold leading-tight text-ink">{building.receptionist.name}</div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[.05em] text-muted">
            <span className={`h-1 w-1 rounded-full ${statusTone(building.receptionist.status)}`} />
            Front desk · {building.receptionist.shift}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BreadcrumbTrail({
  items,
  className,
}: {
  items: Array<{ label: string; onClick?: () => void }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-muted-light/70">/</span>}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="rounded text-[10.5px] font-semibold text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[10.5px] font-semibold text-ink">{item.label}</span>
          )}
          {index === items.length - 1 && index > 0 && <ArrowUpRight size={10} className="text-muted-light" />}
        </span>
      ))}
    </nav>
  );
}
