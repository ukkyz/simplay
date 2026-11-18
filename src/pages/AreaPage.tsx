import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  Coins,
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
  Share2,
  ShieldCheck,
  Sun,
  Sunset,
  Trees,
  Users,
  Zap,
} from "lucide-react";
import { AreaPlan, BreadcrumbTrail, IsoThumb, StaffSummary } from "@/components/PlanViews";
import { OsmMap, type MapMarker } from "@/components/OsmMap";
import { Scene3D, type SceneView, type TimeOfDay } from "@/components/Scene3D";
import {
  Badge,
  Button,
  Field,
  IconButton,
  Modal,
  Panel,
  PanelHead,
  Progress,
  inputClass,
} from "@/components/ui";
import { ASSET_BUDGET, ROOM_STYLES, USER } from "@/lib/data";
import { navigate, usePageTitle } from "@/lib/router";
import { useSimplayz } from "@/lib/store";
import type { Building, Room } from "@/lib/types";
import { cn } from "@/utils/cn";
import { PageFooter } from "@/components/AppShell";

const timeOptions: Array<{ id: TimeOfDay; label: string; Icon: typeof Sun }> = [
  { id: "day", label: "Day", Icon: Sun },
  { id: "dusk", label: "Dusk", Icon: Sunset },
  { id: "night", label: "Night", Icon: Moon },
];

const categoryOptions = [
  { id: "studio", label: "Innovation studio", accent: "#cf6d47", soft: "#f8e4d9", roof: "#b8563a" },
  { id: "social", label: "Social club", accent: "#5c8ca4", soft: "#e1edf2", roof: "#3f6f86" },
  { id: "garden", label: "Community garden", accent: "#6f9a4f", soft: "#e6efdb", roof: "#4f7d56" },
  { id: "residence", label: "Residential co-op", accent: "#a8834e", soft: "#f2e8d5", roof: "#8c6c3e" },
  { id: "workshop", label: "Workshop", accent: "#9d83c2", soft: "#ece4f6", roof: "#8066a5" },
];

const planSlots = [
  { x: 14, y: 10, w: 7, h: 5 },
  { x: 2, y: 10, w: 8, h: 5 },
  { x: 13, y: 2, w: 8, h: 6 },
];

export function AreaPage({ userId, areaId }: { userId: string; areaId: string }) {
  const { world, addBuilding, addActivity, notify } = useSimplayz();
  const area = world.areas.find((candidate) => candidate.id === areaId);
  usePageTitle(area ? `${area.name} · Area` : "Area not found");
  const [selectedBuildingId, setSelectedBuildingId] = useState(area?.buildings[0]?.id ?? "");
  const [view, setView] = useState<SceneView>("iso");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [planZoom, setPlanZoom] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(categoryOptions[0].id);

  useEffect(() => {
    setSelectedBuildingId(area?.buildings[0]?.id ?? "");
    setView("iso");
    setPlanZoom(1);
  }, [area?.id, area?.buildings.length]);

  const selectedBuilding =
    area?.buildings.find((building) => building.id === selectedBuildingId) ?? area?.buildings[0];

  const markers = useMemo<MapMarker[]>(() => {
    if (!area) return [];
    return [
      {
        id: "you-area",
        lat: area.coordinates.lat,
        lng: area.coordinates.lng,
        kind: "player",
        label: "Alex · area",
        initials: USER.initials,
        avatarColor: "#172019",
        tone: "lime",
      },
      ...area.buildings.map((building, index) => ({
        id: building.id,
        lat: area.coordinates.lat + (8.5 - (building.plan.y + building.plan.h / 2)) * 0.00013,
        lng: area.coordinates.lng + (building.plan.x + building.plan.w / 2 - 12) * 0.00021 + index * 0.00001,
        kind: "building" as const,
        label: building.name,
        tone: (selectedBuilding?.id === building.id ? "lime" : "coral") as "lime" | "coral",
        onClick: () => setSelectedBuildingId(building.id),
      })),
    ];
  }, [area, selectedBuilding?.id]);

  if (!area) {
    return (
      <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-paper text-muted">
          <MapPin size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">This area isn&apos;t on your map.</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          The area <span className="font-mono text-[11px]">{areaId}</span> is not part of @{userId}&apos;s world. It may have been
          renamed or reset.
        </p>
        <Button className="mt-5" onClick={() => navigate("/")}>
          Back to the world map
        </Button>
      </div>
    );
  }

  const addBuildingToArea = () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2) return;
    const palette = categoryOptions.find((category) => category.id === newCategory) ?? categoryOptions[0];
    const slot = planSlots[area.buildings.length % planSlots.length];
    const id = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`;
    const now = Date.now();
    const rooms: Room[] = [
      { id: `${id}-welcome`, name: "Welcome Desk", type: "lobby", area: 28, x: 0, y: 0, w: 6, h: 5, status: "setup", occupants: 0 },
      { id: `${id}-main`, name: "Main Floor", type: "workspace", area: 88, x: 6, y: 0, w: 9, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-focus`, name: "Focus Room", type: "focus", area: 22, x: 15, y: 0, w: 5, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-social`, name: "Common Room", type: "social", area: 46, x: 0, y: 5, w: 6, h: 9, status: "setup", occupants: 0 },
      { id: `${id}-green`, name: "Green Corner", type: "garden", area: 60, x: 6, y: 9, w: 14, h: 5, status: "setup", occupants: 0 },
    ];
    const building: Building = {
      id,
      name: trimmed,
      category: palette.label,
      description:
        "A freshly surveyed building site. Your AI crew has staged the minimum viable layout — the interior is ready for the first edit pass.",
      level: 1,
      accent: palette.accent,
      accentSoft: palette.soft,
      roof: palette.roof,
      plan: slot,
      rooms,
      guard: {
        name: "Rune Vale",
        initials: "RV",
        role: "Guard",
        shift: "18:00 – 02:00",
        status: "handoff",
      },
      receptionist: {
        name: "Tess Marlow",
        initials: "TM",
        role: "Receptionist",
        shift: "08:00 – 16:00",
        status: "on-duty",
      },
      metrics: { efficiency: 64, power: 42, water: 37, footfall: 18 },
    };
    addBuilding(area.id, building);
    addActivity({
      bot: "cto",
      title: "Building site provisioned",
      detail: `${trimmed} added to ${area.name} with 5 starter rooms · LOD0–LOD3 chained`,
      tone: "coral",
    });
    notify(`${trimmed} is on the plot`, "Five starter rooms placed. Minimum guard and reception cover assigned.", "lime");
    setSelectedBuildingId(building.id);
    setNewName("");
    setAddOpen(false);
    void now;
  };

  const shareArea = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Area link copied", "Share the plot with another world builder.", "sky");
    } catch {
      notify("Copy unavailable", "Your browser blocked clipboard access.", "coral");
    }
  };

  const nextLevel = Math.round((area.xp / area.xpNext) * 100);
  const totalArea = area.buildings.reduce(
    (sum, building) => sum + building.rooms.reduce((roomSum, room) => roomSum + room.area, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[1560px] px-3 pb-2 pt-4 sm:px-5 lg:px-7">
      <BreadcrumbTrail
        items={[
          { label: "World", onClick: () => navigate("/") },
          { label: "Rotterdam", onClick: () => navigate("/") },
          { label: area.name },
        ]}
        className="mb-3"
      />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-paper text-ink">
              <Trees size={14} />
            </span>
            <Badge tone="lime" dot>
              Player area · Live
            </Badge>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[.09em] text-muted">
              {area.lotCode} · {area.district}
            </span>
          </div>
          <h1 className="font-display text-[34px] font-semibold leading-[.95] tracking-[-.05em] text-ink sm:text-[44px]">
            {area.name}
          </h1>
          <p className="mt-2 max-w-[72ch] text-[12px] leading-relaxed text-muted">{area.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={shareArea}>
            <Share2 size={14} />
            Share area
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(`/user/${USER.id}/area/${area.id}/building/${selectedBuilding?.id ?? ""}`)}
            className="hidden sm:inline-flex"
          >
            <Eye size={14} />
            Open site
          </Button>
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Add building
          </Button>
        </div>
      </div>

      <Panel className="mt-4 grid grid-cols-2 overflow-hidden rounded-[18px] border-line bg-paper/70 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-line">
        <div className="col-span-2 flex items-center gap-3 border-b border-line px-4 py-3 sm:col-span-1 lg:border-b-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-lime">
            <Leaf size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[.09em] text-muted">Area level</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold leading-none">{area.level}</span>
              <span className="text-[9px] text-muted">/ 20</span>
            </div>
          </div>
        </div>
        {[
          { icon: Building2, label: "Buildings", value: area.buildings.length, meta: `of 5 lots` },
          { icon: Users, label: "Residents", value: area.residents, meta: "+12 this week" },
          { icon: Heart, label: "Happiness", value: `${area.happiness}%`, meta: "above target" },
          { icon: Coins, label: "Weekly net", value: `ƒ${area.income.toLocaleString("en-US")}`, meta: "credits" },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3",
                index < 2 && "border-b border-line lg:border-b-0",
                index === 1 && "border-r-0 sm:border-r lg:border-r-0",
                index === 2 && "border-r border-line sm:border-r-0",
              )}
            >
              <Icon size={13} className="shrink-0 text-muted" />
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[.08em] text-muted">{metric.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="font-display text-[18px] font-semibold leading-none tracking-[-.02em]">
                    {metric.value}
                  </span>
                  <span className="hidden truncate text-[8.5px] text-muted xl:inline">{metric.meta}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[.08em] text-muted">Next level</span>
              <span className="font-mono text-[8px] text-muted">{nextLevel}%</span>
            </div>
            <Progress value={nextLevel} tone="#a6d73c" className="mt-1.5" />
            <div className="mt-1 font-mono text-[7.5px] text-muted-light">
              {area.xp.toLocaleString()} / {area.xpNext.toLocaleString()} xp
            </div>
          </div>
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-3">
          <PanelHead
            eyebrow="2D · Street context"
            title="Area mini map"
            icon={<MapPin size={13} />}
            action={
              <IconButton
                label="Open in world map"
                onClick={() => navigate("/")}
                className="h-7 w-7 border border-line bg-paper text-muted hover:text-ink"
              >
                <Maximize2 size={12} />
              </IconButton>
            }
          />
          <div className="relative mx-3 mb-2.5 min-h-[212px] flex-1 overflow-hidden rounded-xl border border-line">
            <OsmMap
              center={area.coordinates}
              zoom={17}
              polygon={area.polygon}
              markers={markers}
              compact
              showControls={false}
              showAttribution
              ariaLabel={`${area.name} street map`}
              className="absolute inset-0"
            />
            <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-line bg-paper/90 px-1.5 py-1 font-mono text-[7px] uppercase tracking-[.06em] text-muted backdrop-blur">
              51.9162° N
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[.06em] text-muted">
              {area.city} · {area.lotCode}
            </span>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-[9px] font-semibold text-ink hover:text-muted"
            >
              World map <ArrowUpRight size={10} />
            </button>
          </div>
        </Panel>

        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-5">
          <PanelHead
            eyebrow="Top-down · 1:200"
            title="2D area layout plan"
            icon={<Layers size={13} />}
            description={`${area.buildings.length} buildings · ${totalArea.toLocaleString("en-US")} m² planned · ${(area.buildings.length * 2.4).toFixed(1)}k m² green`}
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
              <AreaPlan
                area={area}
                selectedId={selectedBuilding?.id}
                onSelect={setSelectedBuildingId}
                onOpen={(id) => navigate(`/user/${USER.id}/area/${area.id}/building/${id}`)}
              />
            </div>
            {selectedBuilding && (
              <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-md border border-line bg-paper/90 px-2 py-1 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: selectedBuilding.accent }} />
                <span className="text-[8.5px] font-semibold text-ink">{selectedBuilding.name}</span>
                <span className="font-mono text-[7px] uppercase text-muted">selected</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
            <div className="flex items-center gap-3 font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-[#cf6d47]" /> built
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#93ad6d]" /> green
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-[#f7f4e9] outline outline-1 outline-[#c6c4b4]" /> path
              </span>
            </div>
            <span className="text-[8.5px] text-muted">Double-click to open a site</span>
          </div>
        </Panel>

        <Panel className="flex min-h-[342px] flex-col overflow-hidden xl:col-span-4">
          <PanelHead
            eyebrow="WebGL · Live from plan"
            title="3D area preview"
            icon={<Box size={13} />}
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
            <Scene3D
              mode="area"
              area={area}
              selectedId={selectedBuilding?.id}
              onSelect={setSelectedBuildingId}
              view={view}
              timeOfDay={time}
              className="absolute inset-0"
              ariaLabel={`Interactive 3D preview of ${area.name}`}
            />
            <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full border border-white/40 bg-ink/80 px-2 py-1 font-mono text-[7px] font-medium uppercase tracking-[.05em] text-paper backdrop-blur">
              <span className="h-1 w-1 rounded-full bg-lime" />
              real-time
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
              <div className="rounded-lg border border-white/40 bg-paper/90 px-2 py-1.5 backdrop-blur">
                <div className="text-[8px] font-bold uppercase tracking-[.07em] text-muted">Focused building</div>
                <div className="mt-0.5 text-[10.5px] font-bold text-ink">{selectedBuilding?.name ?? "None"}</div>
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
              {area.buildings.length} meshes · 18.4k tris
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[9px]"
              onClick={() => {
                setView(view === "iso" ? "orbit" : "iso");
                notify("Camera preset applied", "Orbit the plot to audit sightlines from street level.", "neutral");
              }}
            >
              Inspect <ChevronRight size={10} />
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 font-mono text-[8.5px] font-semibold uppercase tracking-[.11em] text-muted">
            <Building2 size={11} />
            Building inventory
          </div>
          <h2 className="mt-1 font-display text-[24px] font-semibold tracking-[-.035em]">Buildings in this area</h2>
          <p className="mt-1 text-[11px] text-muted">
            Every site is plan-derived. Select a building to focus the map, plan, and 3D model.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="outline">
            {area.buildings.length} / 5 lots
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={12} />
            Add building
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
          {area.buildings.map((building) => {
            const isSelected = selectedBuilding?.id === building.id;
            return (
              <article
                key={building.id}
                onClick={() => setSelectedBuildingId(building.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setSelectedBuildingId(building.id);
                }}
                tabIndex={0}
                role="button"
                aria-label={`Focus ${building.name}`}
                className={cn(
                  "group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border bg-paper text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float",
                  isSelected ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
                )}
              >
                <div className="relative h-[128px] overflow-hidden border-b border-line bg-bone/40">
                  <IsoThumb building={building} />
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md border border-line bg-paper/90 px-1.5 py-1 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: building.accent }} />
                    <span className="font-mono text-[7px] font-medium uppercase tracking-[.04em] text-muted">
                      {building.category}
                    </span>
                  </div>
                  <span className="absolute right-2 top-2 rounded-md bg-ink/85 px-1.5 py-1 font-mono text-[7px] font-medium uppercase tracking-[.05em] text-lime">
                    L{building.level} · {building.rooms.length} rooms
                  </span>
                </div>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[17px] font-semibold leading-tight tracking-[-.03em]">
                        {building.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">
                        <span className="grid h-3.5 w-3.5 place-items-center rounded bg-bone-deep">
                          <Building2 size={8} />
                        </span>
                        {building.rooms.reduce((sum, room) => sum + room.area, 0)} m² · F1
                      </div>
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors",
                        isSelected ? "bg-lime text-ink" : "border border-line text-muted group-hover:text-ink",
                      )}
                    >
                      <ArrowUpRight size={12} />
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-muted">{building.description}</p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex flex-1 items-center gap-1.5">
                      <ShieldCheck size={11} className="text-sage-deep" />
                      <span className="truncate text-[9px] font-medium text-ink">{building.guard.name}</span>
                    </div>
                    <div className="flex flex-1 items-center gap-1.5">
                      <Users size={11} className="text-coral" />
                      <span className="truncate text-[9px] font-medium text-ink">{building.receptionist.name}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Zap size={10} className="text-muted" />
                      <span className="font-mono text-[8px] text-muted">{building.metrics.efficiency}% eff</span>
                    </div>
                    <Button
                      variant={isSelected ? "primary" : "secondary"}
                      size="sm"
                      className="h-7 px-2.5 text-[9.5px]"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/user/${USER.id}/area/${area.id}/building/${building.id}`);
                      }}
                    >
                      Open site <ArrowRight size={10} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="group flex min-h-[300px] flex-col items-center justify-center rounded-[20px] border border-dashed border-line-strong bg-paper/35 px-5 text-center transition-colors hover:border-ink hover:bg-paper/70"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-muted transition-colors group-hover:border-ink group-hover:bg-lime group-hover:text-ink">
              <Plus size={16} />
            </span>
            <span className="mt-3 font-display text-[15px] font-semibold">Plan another building</span>
            <span className="mt-1 text-[10px] leading-relaxed text-muted">
              A new site gets a starter layout and its own staffing profile.
            </span>
            <span className="mt-3 font-mono text-[7.5px] uppercase tracking-[.07em] text-muted-light">
              {5 - area.buildings.length} lots remaining
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-4">
          <Panel className="overflow-hidden">
            <PanelHead
              eyebrow="Asset handoff"
              title="Technical budget"
              description={`${area.name} · locked at the current layout revision.`}
              icon={<Zap size={13} />}
              action={<Badge tone="lime" dot>On track</Badge>}
            />
            <div className="space-y-3 px-4 pb-4">
              {ASSET_BUDGET.map((item) => {
                const percent = (item.value / item.cap) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-semibold text-ink/80">{item.label}</span>
                      <span className="font-mono text-[8.5px] text-muted">
                        {item.value.toLocaleString("en-US")}
                        {item.unit} / {item.cap.toLocaleString("en-US")}
                        {item.unit}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      tone={percent > 82 ? "#cf6d47" : percent > 65 ? "#9ab548" : "#78923c"}
                      className="mt-1.5"
                      height={4}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mx-4 mb-4 divide-y divide-line rounded-xl border border-line bg-bone/35 text-[9px]">
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <Check size={10} className="text-sage-deep" /> LOD0 → LOD3 chain
                </span>
                <span className="font-mono text-[8px] text-ink">verified</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <Check size={10} className="text-sage-deep" /> Texture compression
                </span>
                <span className="font-mono text-[8px] text-ink">BC7 / ASTC</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock3 size={10} /> Last profiled
                </span>
                <span className="font-mono text-[8px] text-ink">12m ago</span>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHead eyebrow="Operations" title="Area pulse" icon={<Heart size={13} />} />
            <div className="grid grid-cols-2 gap-px bg-line">
              {[
                { label: "Open rooms", value: `${area.buildings.reduce((sum, building) => sum + building.rooms.length, 0)}`, sub: "across sites" },
                { label: "Staff on duty", value: "6", sub: "2 per building" },
                { label: "Green cover", value: "38%", sub: "+4% this month" },
                { label: "Visitors today", value: "214", sub: "+18% vs avg" },
              ].map((stat) => (
                <div key={stat.label} className="bg-paper px-3.5 py-3">
                  <div className="text-[8.5px] font-semibold uppercase tracking-[.06em] text-muted">{stat.label}</div>
                  <div className="mt-0.5 font-display text-[19px] font-semibold leading-none tracking-[-.02em]">{stat.value}</div>
                  <div className="mt-1 font-mono text-[7.5px] text-muted-light">{stat.sub}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3">
              <StaffSummary building={selectedBuilding ?? area.buildings[0]} />
              <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
                <span>Minimum staffing policy</span>
                <span className="flex items-center gap-1 font-semibold text-sage-deep">
                  <Check size={10} /> 2 / 2 covered
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Plan a new building"
        description="The site will be auto-placed in the next available lot and provisioned with a minimum guard and receptionist."
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-bone/40 p-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-lime">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-bold">Next available lot · {planSlots[area.buildings.length % planSlots.length].w * 10} × {planSlots[area.buildings.length % planSlots.length].h * 10} m</div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[.05em] text-muted">
                Site lot {area.buildings.length + 1} of 5 · auto-placed
              </div>
            </div>
            <Badge tone="lime" className="ml-auto">Ready</Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Building name" htmlFor="building-name">
              <input
                id="building-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={36}
                placeholder="e.g. Hillside Workshop"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Category" htmlFor="building-category">
              <select
                id="building-category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className={inputClass}
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-[.09em] text-ink/70">Starter layout · 5 rooms</div>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {[
                ["lobby", "Welcome"],
                ["workspace", "Main floor"],
                ["focus", "Focus"],
                ["social", "Common"],
                ["garden", "Green"],
              ].map(([type, label]) => {
                const style = ROOM_STYLES[type as keyof typeof ROOM_STYLES];
                return (
                  <div
                    key={label}
                    className="rounded-lg border border-line px-1.5 py-2 text-center"
                    style={{ background: style.soft }}
                  >
                    <div className="mx-auto h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
                    <div className="mt-1 truncate text-[7.5px] font-bold text-ink">{label}</div>
                    <div className="mt-0.5 font-mono text-[6.5px] uppercase text-muted">ready</div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Staffing: <strong className="font-semibold text-ink">1 guard minimum</strong> and{" "}
              <strong className="font-semibold text-ink">1 receptionist minimum</strong> are automatically assigned. The
              layout is intentionally editable in the next step.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-sage/35 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-[9.5px] text-muted">
              <ShieldCheck size={12} className="text-sage-deep" />
              Handoff includes LOD0–LOD3 and BC7 / ASTC texture overrides.
            </span>
            <Badge tone="outline">8.2k tris</Badge>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="lime" onClick={addBuildingToArea} disabled={newName.trim().length < 2}>
              <Plus size={13} />
              Add building
            </Button>
          </div>
        </div>
      </Modal>

      <PageFooter />
    </div>
  );
}
