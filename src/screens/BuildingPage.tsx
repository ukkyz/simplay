"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  Clock3,
  Coffee,
  DoorOpen,
  Eye,
  Heart,
  Layers,
  Leaf,
  MapPin,
  Maximize2,
  Minus,
  Moon,
  Plus,
  Rotate3d,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  Trees,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PageFooter } from "@/components/AppShell";
import { OsmMap, type MapMarker } from "@/components/OsmMap";
import { BreadcrumbTrail, BuildingPlan } from "@/components/PlanViews";
import type { SceneView, TimeOfDay } from "@/components/Scene3D";
import { ScenePreview } from "@/components/ScenePreview";
import {
  Avatar,
  Badge,
  Button,
  Field,
  IconButton,
  Modal,
  Panel,
  PanelHead,
  inputClass,
} from "@/components/ui";
import { ROOM_STYLES } from "@/lib/data";
import { useNavigate } from "@/lib/router";
import { useSimplayz } from "@/lib/store";
import type { RoomType } from "@/lib/types";
import { maxCarvedArea, MIN_ROOM_AREA, splitFootprint } from "@/lib/world-rules";
import { cn } from "@/utils/cn";

const timeOptions: Array<{ id: TimeOfDay; label: string; Icon: LucideIcon }> = [
  { id: "day", label: "Day", Icon: Sun },
  { id: "dusk", label: "Dusk", Icon: Sunset },
  { id: "night", label: "Night", Icon: Moon },
];

const ROOM_ICONS: Record<RoomType, LucideIcon> = {
  lobby: DoorOpen,
  workspace: BriefcaseBusiness,
  security: ShieldCheck,
  social: Coffee,
  focus: BookOpen,
  garden: Leaf,
  meeting: Users,
};

const roomTypeOptions: RoomType[] = ["workspace", "focus", "meeting", "social", "garden", "lobby", "security"];

export function BuildingPage({
  userId,
  areaId,
  buildingId,
}: {
  userId: string;
  areaId: string;
  buildingId: string;
}) {
  const navigate = useNavigate();
  const { world, player, execute, isSaving, notify } = useSimplayz();
  const area = world.areas.find((candidate) => candidate.id === areaId);
  const building = area?.buildings.find((candidate) => candidate.id === buildingId);

  const [selectedRoomId, setSelectedRoomId] = useState<string>(building?.rooms[0]?.id ?? "");
  const [view, setView] = useState<SceneView>("iso");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [planZoom, setPlanZoom] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("focus");
  const [sourceRoomId, setSourceRoomId] = useState("");
  const [roomSize, setRoomSize] = useState("24");

  useEffect(() => {
    setSelectedRoomId(building?.rooms[0]?.id ?? "");
    setView("iso");
    setPlanZoom(1);
  }, [building?.id]);

  const openAddRoom = () => {
    const sorted = [...(building?.rooms ?? [])].sort((a, b) => b.w * b.h - a.w * a.h);
    const source = sorted.find((room) => splitFootprint(room)) ?? sorted[0];
    setSourceRoomId(source?.id ?? "");
    setRoomName("");
    setRoomType("focus");
    setRoomSize(String(source ? Math.max(MIN_ROOM_AREA, Math.min(24, maxCarvedArea(source))) : 24));
    setAddOpen(true);
  };

  const sourceRoom = building?.rooms.find((room) => room.id === sourceRoomId);
  const split = sourceRoom ? splitFootprint(sourceRoom) : null;
  const maxArea = sourceRoom && split ? maxCarvedArea(sourceRoom) : MIN_ROOM_AREA;
  const requestedArea = Number(roomSize);
  const validSize = Number.isFinite(requestedArea) && requestedArea >= MIN_ROOM_AREA && requestedArea <= maxArea;

  const selectedRoom = building?.rooms.find((room) => room.id === selectedRoomId) ?? building?.rooms[0];
  const totalArea = building?.rooms.reduce((sum, room) => sum + room.area, 0) ?? 0;

  const site = useMemo(() => {
    if (!area || !building) return null;
    const centerLat = area.coordinates.lat + (8.5 - (building.plan.y + building.plan.h / 2)) * 0.00013;
    const centerLng = area.coordinates.lng + (building.plan.x + building.plan.w / 2 - 12) * 0.00021;
    const latSpan = 0.00015;
    const lngSpan = 0.00025;
    return {
      center: { lat: centerLat, lng: centerLng },
      polygon: [
        { lat: centerLat + latSpan, lng: centerLng - lngSpan },
        { lat: centerLat + latSpan, lng: centerLng + lngSpan },
        { lat: centerLat - latSpan, lng: centerLng + lngSpan },
        { lat: centerLat - latSpan, lng: centerLng - lngSpan },
      ],
    };
  }, [area, building]);

  const markers = useMemo<MapMarker[]>(() => {
    if (!site || !building) return [];
    return [
      {
        id: building.id,
        lat: site.center.lat,
        lng: site.center.lng,
        kind: "area",
        label: building.name,
        sublabel: `Building site · ${building.rooms.length} rooms`,
        tone: "lime",
        active: true,
        level: building.level,
      },
      {
        id: "site-entry",
        lat: site.center.lat - 0.00019,
        lng: site.center.lng + 0.00016,
        kind: "player",
        label: `${player.name.split(" ")[0]} · you`,
        initials: player.initials,
        avatarColor: "#172019",
        tone: "lime",
      },
      {
        id: "site-neighbor",
        lat: site.center.lat + 0.00011,
        lng: site.center.lng - 0.00023,
        kind: "dot",
        label: "Neighboring lot",
        tone: "sky",
      },
    ];
  }, [site, building, player.initials, player.name]);

  if (!area || !building) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-paper text-muted">
          <Building2 size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">No such building site.</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          The site <span className="font-mono text-[11px]">{buildingId}</span> is no longer part of this area. Open another
          site from {area?.name ?? "your world"}.
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => navigate(area ? `/user/${userId}/area/${area.id}` : "/")}>Back to area</Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            World map
          </Button>
        </div>
      </div>
    );
  }

  const roomTypeTotals = (Object.keys(ROOM_STYLES) as RoomType[])
    .map((type) => {
      const rooms = building.rooms.filter((room) => room.type === type);
      return {
        type,
        label: ROOM_STYLES[type].label,
        color: ROOM_STYLES[type].color,
        soft: ROOM_STYLES[type].soft,
        count: rooms.length,
        area: rooms.reduce((sum, room) => sum + room.area, 0),
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.area - a.area);

  const addRoom = async () => {
    const name = roomName.trim();
    if (!split || !sourceRoom || !validSize || name.length < 2) return;
    const result = await execute({
      type: "split-room", areaId: area.id, buildingId: building.id, sourceRoomId: sourceRoom.id,
      name, roomType, area: requestedArea,
    });
    if (!result?.createdId) return;
    setSelectedRoomId(result.createdId);
    setAddOpen(false);
    notify(`${name} is in the plan`, "Minimum staffing is unchanged. The plan is saved.", "lime");
  };

  return (
    <div className="mx-auto max-w-[1560px] px-3 pb-2 pt-4 sm:px-5 lg:px-7">
      <BreadcrumbTrail
        items={[
          { label: "World", onClick: () => navigate("/") },
          { label: area.name, onClick: () => navigate(`/user/${player.id}/area/${area.id}`) },
          { label: building.name },
        ]}
        className="mb-3"
      />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg border"
              style={{ background: building.accentSoft, borderColor: building.accent, color: building.accent }}
            >
              <Building2 size={14} />
            </span>
            <Badge tone="outline">Building site</Badge>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[.09em] text-muted">
              {building.category} · LOD0–LOD3
            </span>
          </div>
          <h1 className="font-display text-[34px] font-semibold leading-[.95] tracking-[-.05em] text-ink sm:text-[44px]">
            {building.name}
          </h1>
          <p className="mt-2 max-w-[78ch] text-[12px] leading-relaxed text-muted">{building.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(`/user/${player.id}/area/${area.id}`)}
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back to</span> {area.name}
          </Button>
          <Button variant="primary" size="md" onClick={openAddRoom}>
            <Plus size={15} />
            Add room
          </Button>
        </div>
      </div>

      <Panel className="mt-4 grid grid-cols-2 overflow-hidden rounded-[18px] border-line bg-paper/70 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-line">
        {[
          { icon: Layers, label: "Floor area", value: `${totalArea} m²`, meta: "ground floor", iconColor: "text-muted" },
          { icon: Building2, label: "Rooms", value: `${building.rooms.length}`, meta: `${building.rooms.filter((r) => r.status === "live").length} live` },
          { icon: ShieldCheck, label: "Guard", value: "1 / 1", meta: "minimum met", accent: true },
          { icon: UserRound, label: "Reception", value: "1 / 1", meta: "minimum met", accent: true },
          { icon: Heart, label: "Efficiency", value: `${building.metrics.efficiency}%`, meta: "above target" },
          { icon: Users, label: "Footfall", value: `${building.metrics.footfall}%`, meta: "+8% vs avg" },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={cn(
                "flex items-center gap-2.5 border-line px-4 py-3",
                index < 4 && "border-b lg:border-b-0",
                index % 2 === 0 && "border-r",
                index === 1 && "sm:border-r",
                index === 3 && "sm:border-r-0 lg:border-r",
              )}
            >
              <Icon size={13} className={metric.accent ? "shrink-0 text-sage-deep" : "shrink-0 text-muted"} />
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[.08em] text-muted">{metric.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-display text-[18px] font-semibold leading-none tracking-[-.02em]">
                    {metric.value}
                  </span>
                  <span className="hidden truncate text-[8px] text-muted xl:inline">{metric.meta}</span>
                </div>
              </div>
              {metric.accent && (
                <span className="ml-auto grid h-4 w-4 shrink-0 place-items-center rounded-full bg-lime-soft text-sage-deep">
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
            </div>
          );
        })}
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-3">
          <PanelHead
            eyebrow="2D · Street context"
            title="Building site mini map"
            icon={<MapPin size={13} />}
            action={
              <IconButton
                label="Open area map"
                onClick={() => navigate(`/user/${player.id}/area/${area.id}`)}
                className="h-7 w-7 border border-line bg-paper text-muted hover:text-ink"
              >
                <Maximize2 size={12} />
              </IconButton>
            }
          />
          <div className="relative mx-3 mb-2.5 min-h-[212px] flex-1 overflow-hidden rounded-xl border border-line">
            {site && (
              <OsmMap
                center={site.center}
                zoom={18}
                polygon={site.polygon}
                markers={markers}
                compact
                showControls={false}
                ariaLabel={`${building.name} street map`}
                className="absolute inset-0"
              />
            )}
            <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-line bg-paper/90 px-1.5 py-1 font-mono text-[7px] uppercase tracking-[.06em] text-muted backdrop-blur">
              Z18 · site
            </div>
          </div>
          <div className="border-t border-line px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[.06em] text-muted">
                {area.district} · {area.city}
              </span>
              <button
                type="button"
                onClick={() => navigate(`/user/${player.id}/area/${area.id}`)}
                className="flex items-center gap-1 text-[9px] font-semibold text-ink hover:text-muted"
              >
                Area map <ArrowUpRight size={10} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[8.5px] text-muted">
              <Trees size={10} className="text-sage-deep" />
              4 min walk to transit
              <span className="h-2.5 w-px bg-line" />
              <span className="font-mono text-[8px]">{area.lotCode}</span>
            </div>
          </div>
        </Panel>

        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-5">
          <PanelHead
            eyebrow="Top-down · 1:50"
            title="2D building site layout plan"
            icon={<Layers size={13} />}
            description={`${building.rooms.length} rooms · ${totalArea} m² · click a room to inspect it in 3D`}
            action={
              <div className="flex items-center rounded-full border border-line bg-paper">
                <IconButton
                  label="Zoom out plan"
                  onClick={() => setPlanZoom((current) => Math.max(1, Number((current - 0.1).toFixed(1))))}
                  className="h-6 w-6"
                >
                  <Minus size={11} />
                </IconButton>
                <span className="min-w-[28px] text-center font-mono text-[8px] text-muted">{Math.round(planZoom * 100)}%</span>
                <IconButton
                  label="Zoom in plan"
                  onClick={() => setPlanZoom((current) => Math.min(1.5, Number((current + 0.1).toFixed(1))))}
                  className="h-6 w-6"
                >
                  <Plus size={11} />
                </IconButton>
              </div>
            }
          />
          <div className="relative mx-3 mb-2.5 min-h-[216px] flex-1 overflow-hidden rounded-xl border border-line">
            <div
              className="h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `scale(${planZoom})`, transformOrigin: "center center" }}
            >
              <BuildingPlan building={building} selectedId={selectedRoom?.id} onSelect={setSelectedRoomId} />
            </div>
            {selectedRoom && (
              <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-md border border-line bg-paper/90 px-2 py-1 backdrop-blur">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: ROOM_STYLES[selectedRoom.type].color }}
                />
                <span className="text-[8.5px] font-semibold text-ink">{selectedRoom.name}</span>
                <span className="font-mono text-[7px] uppercase text-muted">{selectedRoom.area} m²</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
            <div className="flex items-center gap-3 font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">
              {roomTypeTotals.slice(0, 3).map((item) => (
                <span key={item.type} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[8.5px] text-muted">
              <ShieldCheck size={10} className="text-sage-deep" /> min. cover 2 / 2
            </span>
          </div>
        </Panel>

        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-4">
          <PanelHead
            eyebrow="WebGL · Cutaway"
            title="3D building preview"
            icon={<Building2 size={13} />}
            action={
              <div className="flex items-center rounded-full border border-line bg-paper p-0.5">
                {(["iso", "top", "orbit"] as SceneView[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    aria-label={`${option} view`}
                    aria-pressed={view === option}
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full transition-colors",
                      view === option ? "bg-ink text-lime" : "text-muted hover:text-ink",
                    )}
                  >
                    {option === "iso" ? <Rotate3d size={11} /> : option === "top" ? <Layers size={11} /> : <Eye size={11} />}
                  </button>
                ))}
              </div>
            }
          />
          <div className="relative mx-3 mb-2.5 min-h-[216px] flex-1 overflow-hidden rounded-xl border border-line bg-sage/40">
            <ScenePreview
              mode="building"
              building={building}
              selectedId={selectedRoom?.id}
              onSelect={setSelectedRoomId}
              view={view}
              timeOfDay={time}
              className="absolute inset-0"
              ariaLabel={`Interactive cutaway preview of ${building.name}`}
            />
            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full border border-white/40 bg-ink/80 px-2 py-1 font-mono text-[7px] font-medium uppercase tracking-[.05em] text-paper backdrop-blur">
              <span className="h-1 w-1 rounded-full bg-lime" />
              cutaway · L1
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
              <div className="rounded-lg border border-white/40 bg-paper/90 px-2 py-1.5 backdrop-blur">
                <div className="text-[8px] font-bold uppercase tracking-[.07em] text-muted">Room focused</div>
                <div className="mt-0.5 text-[10.5px] font-bold text-ink">
                  {selectedRoom?.name ?? "None"} · {selectedRoom?.area ?? 0} m²
                </div>
              </div>
              <div className="pointer-events-auto flex items-center rounded-full border border-white/50 bg-paper/90 p-0.5 shadow-sm backdrop-blur">
                {timeOptions.map((option) => {
                  const Icon = option.Icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTime(option.id)}
                      aria-label={`${option.label} lighting`}
                      aria-pressed={time === option.id}
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full transition-colors",
                        time === option.id ? "bg-ink text-lime" : "text-muted hover:text-ink",
                      )}
                    >
                      <Icon size={11} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[.05em] text-muted">
              {building.rooms.length} rooms · 1 guard · 1 front
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[9px]"
              onClick={() =>
                notify(
                  "Cutaway validated",
                  "First-person checks passed. Ceiling height 3.2 m, clear egress at every room.",
                  "neutral",
                )
              }
            >
              Validate <ChevronRightIcon />
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[8.5px] font-semibold uppercase tracking-[.11em] text-muted">
            <DoorOpen size={11} />
            Room program
          </div>
          <h2 className="mt-1 font-display text-[24px] font-semibold tracking-[-.035em]">Rooms &amp; occupancy</h2>
          <p className="mt-1 text-[11px] text-muted">
            One site, any number of rooms. A guard and receptionist are always required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="lime" dot>
            Staffed 2 / 2
          </Badge>
          <Button variant="secondary" size="sm" onClick={openAddRoom}>
            <Plus size={12} />
            Add room
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
          {building.rooms.map((room) => {
            const style = ROOM_STYLES[room.type];
            const Icon = ROOM_ICONS[room.type];
            const isSelected = selectedRoom?.id === room.id;
            const needsReception = room.type === "lobby";
            const needsGuard = room.type === "security";
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomId(room.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-[18px] border bg-paper p-3 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float",
                  isSelected ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-[10px]"
                    style={{ background: style.soft, color: style.color }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      tone={room.status === "live" ? "lime" : room.status === "ready" ? "neutral" : "coral"}
                      className="px-1.5 py-[2px] text-[8px] tracking-[.04em]"
                    >
                      {room.status}
                    </Badge>
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full",
                        isSelected ? "bg-lime text-ink" : "border border-line text-muted group-hover:text-ink",
                      )}
                    >
                      <ArrowUpRight size={10} />
                    </span>
                  </div>
                </div>
                <h3 className="mt-2 truncate font-display text-[15px] font-semibold leading-tight tracking-[-.03em]">
                  {room.name}
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[.04em] text-muted">
                  <span style={{ color: style.color }}>{style.label}</span>
                  <span className="h-2 w-px bg-line" />
                  {room.area} m²
                  <span className="h-2 w-px bg-line" />
                  {room.occupants} seats
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(3, Math.max(1, room.occupants)) }).map((_, index) => (
                      <Avatar
                        key={index}
                        initials={room.staff && index === 0 ? room.staff.split(" ").map((part) => part[0]).join("") : String.fromCharCode(74 + index + room.name.length)}
                        color={index === 0 && room.staff ? style.color : ["#9c8d75", "#7e9182", "#9e7b67"][index % 3]}
                        size={19}
                        ring
                      />
                    ))}
                  </div>
                  <span className="truncate text-[9px] text-muted">
                    {room.staff ? room.staff : `${room.occupants} staff / residents`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-line pt-2">
                  {needsReception && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-lime-soft px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-[.03em] text-[#4f681c]">
                      <Check size={8} strokeWidth={3} /> Reception min.
                    </span>
                  )}
                  {needsGuard && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-1.5 py-0.5 text-[7.5px] font-bold uppercase tracking-[.03em] text-[#3c6783]">
                      <Check size={8} strokeWidth={3} /> Guard min.
                    </span>
                  )}
                  {!needsReception && !needsGuard && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-bone px-1.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[.03em] text-muted">
                      Standard cover
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[7px] text-muted-light">
                    {room.x},{room.y}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={openAddRoom}
            className="group flex min-h-[176px] flex-col items-center justify-center rounded-[18px] border border-dashed border-line-strong bg-paper/35 px-5 text-center transition-colors hover:border-ink hover:bg-paper/70"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper text-muted transition-colors group-hover:border-ink group-hover:bg-lime group-hover:text-ink">
              <Plus size={15} />
            </span>
            <span className="mt-2.5 font-display text-[14px] font-semibold">Add another room</span>
            <span className="mt-1 text-[9.5px] leading-relaxed text-muted">
              Carve it from an existing space. Plans and 3D update together.
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-4">
          <Panel className="overflow-hidden">
            <PanelHead
              eyebrow="Mandatory · Always on"
              title="Minimum staffing"
              icon={<ShieldCheck size={13} />}
              action={<Badge tone="lime" dot>2 / 2</Badge>}
            />
            <div className="space-y-2 px-4 pb-3">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bone/35 p-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lime">
                  <ShieldCheck size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] font-bold text-ink">{building.guard.name}</span>
                    <span className="flex items-center gap-1 font-mono text-[7.5px] uppercase text-sage-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" /> on duty
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted">Guard · {building.guard.shift}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bone/35 p-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral-soft text-[#9b4a2c]">
                  <UserRound size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] font-bold text-ink">{building.receptionist.name}</span>
                    <span className="flex items-center gap-1 font-mono text-[7.5px] uppercase text-sage-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" /> on duty
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-muted">Receptionist · {building.receptionist.shift}</div>
                </div>
              </div>
            </div>
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-sage/35 px-2.5 py-2 text-[9px] leading-relaxed text-ink/70">
              <Clock3 size={11} className="shrink-0 text-sage-deep" />
              Handoff window 20:00. Coverage cannot drop below one guard and one receptionist.
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
              <span className="font-mono text-[7.5px] uppercase tracking-[.06em] text-muted">Coverage · 100%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[9px]"
                onClick={() =>
                  notify("Rota opened", `Next guard handoff: 20:00. ${building.guard.name} remains the named guard.`, "sky")
                }
              >
                View rota <ArrowRight size={10} />
              </Button>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead
              eyebrow="Space allocation"
              title="Room program"
              icon={<Layers size={13} />}
              action={<span className="font-mono text-[8px] text-muted">{totalArea} m²</span>}
            />
            <div className="px-4 pb-3">
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bone">
                {roomTypeTotals.map((item) => (
                  <div
                    key={item.type}
                    style={{ width: `${(item.area / Math.max(totalArea, 1)) * 100}%`, background: item.color }}
                    title={`${item.label} · ${item.area} m²`}
                  />
                ))}
              </div>
              <div className="mt-2 space-y-1.5">
                {roomTypeTotals.map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-sm" style={{ background: item.color }} />
                    <span className="flex-1 text-[9.5px] font-medium text-ink/80">{item.label}</span>
                    <span className="font-mono text-[8px] text-muted">{item.count} rooms</span>
                    <span className="w-10 text-right font-mono text-[8px] text-muted">{item.area} m²</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-line bg-line">
              <div className="bg-paper px-3 py-2.5">
                <div className="text-[8px] font-semibold uppercase tracking-[.05em] text-muted">Occupancy</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-display text-[17px] font-semibold leading-none">
                    {building.rooms.reduce((sum, room) => sum + room.occupants, 0)}
                  </span>
                  <span className="text-[8px] text-muted">people</span>
                </div>
              </div>
              <div className="bg-paper px-3 py-2.5">
                <div className="text-[8px] font-semibold uppercase tracking-[.05em] text-muted">Growth room</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-display text-[17px] font-semibold leading-none">
                    {Math.max(0, 8 - building.rooms.length)}
                  </span>
                  <span className="text-[8px] text-muted">slots</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[7.5px] font-semibold uppercase tracking-[.1em] text-muted">
                <Zap size={10} /> Runtime budget
              </span>
              <Badge tone="lime">healthy</Badge>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {[
                ["18.4k", "triangles"],
                ["12", "draw calls"],
                ["3.4 MB", "textures"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg bg-bone/50 px-2 py-1.5">
                  <div className="font-display text-[13px] font-semibold leading-none tracking-[-.02em]">{value}</div>
                  <div className="mt-1 font-mono text-[6.5px] uppercase tracking-[.04em] text-muted">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[8.5px] text-muted">
              <Sparkles size={9} className="text-sage-deep" />
              Mobile-safe shader variant active
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a room"
        description="Carve a new room from existing floor area. The 2D plan and 3D cutaway rebuild from the same layout data."
      >
        <div className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room name" htmlFor="room-name">
              <input
                id="room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                maxLength={30}
                placeholder="e.g. Listening Room"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Floor area" htmlFor="room-size" hint="m²">
              <input
                id="room-size"
                type="number"
                min={MIN_ROOM_AREA}
                max={maxArea}
                step="any"
                aria-invalid={Boolean(split && !validSize)}
                aria-describedby={split ? "room-size-range" : undefined}
                value={roomSize}
                onChange={(event) => setRoomSize(event.target.value)}
                className={inputClass}
              />
              {split && <p id="room-size-range" className="mt-1 text-[10px] text-muted">{MIN_ROOM_AREA}–{maxArea} m² available</p>}
            </Field>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.09em] text-ink/70">Room type</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {roomTypeOptions.map((type) => {
                const style = ROOM_STYLES[type];
                const Icon = ROOM_ICONS[type];
                const selected = type === roomType;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRoomType(type)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-all",
                      selected ? "border-ink bg-bone shadow-sm" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md" style={{ background: style.soft, color: style.color }}>
                      <Icon size={12} />
                    </span>
                    <span className="truncate text-[7.5px] font-semibold text-ink">{style.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <Field label="Carve from" htmlFor="room-source">
              <select
                id="room-source"
                value={sourceRoomId}
                onChange={(event) => setSourceRoomId(event.target.value)}
                className={inputClass}
              >
                {building.rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} · {room.w} × {room.h} grid · {room.area} m²
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {sourceRoom && split ? (
            <div className="mt-4 rounded-xl border border-line bg-bone/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] font-semibold uppercase tracking-[.08em] text-muted">Plan preview</span>
                <span className="font-mono text-[8px] text-muted">
                  {sourceRoom.w * sourceRoom.h} grid units →{" "}
                  {split.rest.w * split.rest.h + split.created.w * split.created.h}
                </span>
              </div>
              <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-line">
                <div
                  className="flex items-center justify-center border-r border-line text-[8px] font-semibold"
                  style={{ width: `${((split.horizontal ? split.rest.w : split.rest.h) / Math.max(sourceRoom.w, sourceRoom.h)) * 65}%`, background: ROOM_STYLES[sourceRoom.type].soft }}
                >
                  {sourceRoom.name}
                </div>
                <div
                  className="flex flex-1 items-center justify-center text-[8px] font-semibold"
                  style={{ background: ROOM_STYLES[roomType].soft }}
                >
                  {roomName.trim() || "New room"}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[7.5px] uppercase tracking-[.04em] text-muted">
                <span>{split.horizontal ? "Horizontal" : "Vertical"} split</span>
                <span>
                  {sourceRoom.status === "live" ? "Occupied · relocation auto-planned" : "Ready"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[#f0c1b2] bg-coral-soft p-3 text-[10px] leading-relaxed text-[#9b4a2c]">
              This room is too small to split. Choose a larger source room before adding to the program.
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-sage/35 px-3 py-2.5">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-sage-deep" />
            <div className="text-[9.5px] leading-relaxed text-ink/70">
              Adding a room never changes minimum staffing. The site keeps{" "}
              <strong className="font-semibold text-ink">1 guard</strong> and{" "}
              <strong className="font-semibold text-ink">1 receptionist</strong>. LOD and lighting budgets are rechecked on
              save.
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="lime" onClick={addRoom} disabled={isSaving || !split || !validSize || roomName.trim().length < 2}>
              <Plus size={13} />
              {isSaving ? "Saving…" : "Add room to plan"}
            </Button>
          </div>
        </div>
      </Modal>

      <PageFooter />
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M3.5 1.5 7 5 3.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
