"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Compass,
  Crosshair,
  Heart,
  Layers,
  Loader2,
  LocateFixed,
  MapPin,
  Maximize2,
  Minus,
  Navigation,
  Plus,
  Search,
  Trees,
  Users,
  X,
} from "lucide-react";
import { OsmMap, type MapMarker } from "@/components/OsmMap";
import { BotAvatar, Button, Badge, Kbd, Panel, Toggle } from "@/components/ui";
import { LOCATIONS } from "@/lib/data";
import { useNavigate } from "@/lib/router";
import { useSimplayz } from "@/lib/store";
import { cn } from "@/utils/cn";

const TONE_BY_INDEX = ["lime", "sky", "violet", "coral"] as const;

export function WorldPage() {
  const navigate = useNavigate();
  const { world, player: sharedPlayer, presence, notify } = useSimplayz();
  const mapShellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mapLocation, setMapLocation] = useState({ lat: 51.9175, lng: 4.481, zoom: 14 });
  const [viewCoords, setViewCoords] = useState({ lat: 51.9175, lng: 4.481, zoom: 14 });
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(world.areas[0]?.id ?? null);
  const [customPlace, setCustomPlace] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showPlayers, setShowPlayers] = useState(true);
  const [showAreas, setShowAreas] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);

  const selectedArea = world.areas.find((area) => area.id === selectedAreaId);
  const primaryArea = world.areas[0];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target.tagName);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return LOCATIONS.slice(0, 5);
    return LOCATIONS.filter(
      (location) =>
        location.name.toLowerCase().includes(term) || location.region.toLowerCase().includes(term),
    ).slice(0, 6);
  }, [query]);

  const centerOn = (place: { name: string; region: string; lat: number; lng: number; zoom?: number }, kind = "place") => {
    setMapLocation({ lat: place.lat, lng: place.lng, zoom: place.zoom ?? 14 });
    setViewCoords({ lat: place.lat, lng: place.lng, zoom: place.zoom ?? 14 });
    setSearchOpen(false);
    setQuery("");
    if (kind === "custom") {
      setSelectedAreaId(null);
      setCustomPlace(`${place.name}, ${place.region}`);
    } else if (place.name === "Rotterdam") {
      setSelectedAreaId((current) => current ?? primaryArea?.id ?? null);
      setCustomPlace(null);
    } else {
      setSelectedAreaId(null);
      setCustomPlace(`${place.name}, ${place.region}`);
    }
    notify(`Map centred on ${place.name}`, "Simulation data streams over OpenStreetMap ground.", "sky");
  };

  const searchLocation = async () => {
    const term = query.trim();
    if (!term) {
      searchRef.current?.focus();
      return;
    }
    const known = suggestions.find((location) => location.name.toLowerCase() === term.toLowerCase());
    if (known) {
      centerOn(known);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(term)}`,
      );
      if (!response.ok) throw new Error("Geocoder unavailable");
      const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!data.length) {
        notify("No place found", `Nothing matched “${term}”. Try a broader city name.`, "coral");
        return;
      }
      const result = data[0];
      const parts = result.display_name.split(",").map((part) => part.trim());
      centerOn(
        {
          name: parts[0],
          region: parts.slice(1, 3).join(", "),
          lat: Number(result.lat),
          lng: Number(result.lon),
          zoom: 14,
        },
        "custom",
      );
    } catch {
      notify("Geocoder unavailable", "Check your connection or jump to a saved city below.", "coral");
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      notify("Location is not available", "This browser does not expose GPS coordinates.", "coral");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        centerOn(
          {
            name: "Your location",
            region: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            zoom: 15,
          },
          "custom",
        );
      },
      () => {
        setLocating(false);
        notify("Permission not granted", "Use a city search to place your world instead.", "coral");
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300_000 },
    );
  };

  const markers: MapMarker[] = [
    ...(showAreas
      ? world.areas.map((area, index) => ({
          id: area.id,
          lat: area.coordinates.lat,
          lng: area.coordinates.lng,
          kind: "area" as const,
          label: area.name,
          sublabel: `${area.buildings.length} buildings · ${area.district}`,
          tone: TONE_BY_INDEX[index % TONE_BY_INDEX.length],
          level: area.level,
          active: selectedAreaId === area.id,
          onClick: () => setSelectedAreaId(area.id),
        }))
      : []),
    ...(showPlayers
      ? presence.map((player) => ({
          id: player.id,
          lat: player.lat,
          lng: player.lng,
          kind: "player" as const,
          label: player.status === "You" ? `${sharedPlayer.name.split(" ")[0]} · shared player` : player.name.split(" ")[0],
          initials: player.initials,
          avatarColor: player.color,
          tone: "lime" as const,
          onClick: () =>
            notify(
              player.status === "You" ? "Shared world player" : `${player.name} is online`,
              player.status === "You" ? `${sharedPlayer.name} · ${sharedPlayer.title} · Lvl ${sharedPlayer.level}` : `${player.status} in Rotterdam · nearby`,
              "lime",
            ),
        }))
      : []),
  ];

  const enterSelectedArea = () => {
    if (selectedArea) navigate(`/user/${sharedPlayer.id}/area/${selectedArea.id}`);
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await mapShellRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      notify("Fullscreen unavailable", "Your browser blocked the fullscreen request.", "coral");
    }
  };

  return (
    <div className="mx-auto max-w-[1560px] px-2 pb-4 pt-2 sm:px-4 sm:pt-3 lg:px-6">
      <div
        ref={mapShellRef}
        className="map-shell relative h-[calc(100svh-146px)] min-h-[650px] overflow-hidden rounded-[22px] border border-line-strong/80 bg-[#e8e6da] shadow-soft sm:h-[calc(100svh-86px)] sm:rounded-[26px]"
      >
        <OsmMap
          center={mapLocation}
          zoom={mapLocation.zoom}
          markers={markers}
          onViewChange={(view) => setViewCoords(view)}
          ariaLabel="Rotterdam world map"
          className="absolute inset-0 h-full w-full"
          showControls={false}
          showAttribution={false}
        />

        {/* Location & search */}
        <div className="absolute left-2.5 top-2.5 z-40 w-[min(380px,calc(100%-1.25rem))] sm:left-4 sm:top-4">
          <div className="overflow-hidden rounded-[18px] border border-line bg-paper/95 shadow-float backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-line/80 px-3.5 pb-2.5 pt-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5 text-lime-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-40" />
                </span>
                <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.13em] text-muted">
                  World engine · {customPlace ? "custom" : "home grid"}
                </span>
              </div>
              <span className="rounded-full border border-line bg-bone/70 px-1.5 py-0.5 font-mono text-[7.5px] font-medium uppercase tracking-[.04em] text-muted">
                {presence.length} online
              </span>
            </div>

            <div className="px-3.5 pb-3 pt-3">
              <h1 className="max-w-[30ch] font-display text-[23px] font-semibold leading-[1.03] tracking-[-0.045em] text-ink sm:text-[26px]">
                Where are we building today?
              </h1>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                Your OpenStreetMap world, rendered around players in real time.
              </p>

              <form
                className="relative mt-2.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void searchLocation();
                }}
              >
                <div className="relative flex items-center">
                  <Search size={14} className="pointer-events-none absolute left-3 text-muted" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search a city, address or place"
                    aria-label="Search location"
                    className="h-10 w-full rounded-xl border border-line bg-bone/40 pl-8.5 pr-[66px] text-[11.5px] font-medium text-ink placeholder:text-muted-light transition-all focus:border-ink focus:bg-paper focus:outline-none focus:ring-2 focus:ring-ink/10"
                    style={{ paddingLeft: 32, paddingRight: 64 }}
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        searchRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="absolute right-11 grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-bone hover:text-ink"
                    >
                      <X size={11} />
                    </button>
                  ) : (
                    <span className="pointer-events-none absolute right-11 flex items-center gap-1 text-[9px] text-muted-light">
                      <Kbd>/</Kbd>
                    </span>
                  )}
                  <button
                    type="submit"
                    aria-label="Search location"
                    disabled={searching}
                    className="absolute right-1.5 grid h-7 w-7 place-items-center rounded-lg bg-ink text-lime transition-colors hover:bg-ink-soft disabled:opacity-60"
                  >
                    {searching ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  </button>
                </div>

                {searchOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close search suggestions"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setSearchOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[14px] border border-line bg-paper p-1.5 shadow-float animate-pop">
                      <div className="px-2 pb-1 pt-1.5 font-mono text-[7.5px] uppercase tracking-[.12em] text-muted-light">
                        {query ? "Matching places" : "Jump back in"}
                      </div>
                      {suggestions.length ? (
                        suggestions.map((location) => (
                          <button
                            key={location.name}
                            type="button"
                            onClick={() => centerOn(location)}
                            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bone"
                          >
                            <span className="grid h-7 w-7 place-items-center rounded-md border border-line bg-bone/70 text-muted group-hover:text-ink">
                              <MapPin size={12} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold text-ink">{location.name}</span>
                              <span className="block font-mono text-[8px] text-muted">{location.region}</span>
                            </span>
                            <ArrowUpRight size={12} className="text-muted-light" />
                          </button>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-2 text-[10.5px] text-muted">
                          <Search size={12} />
                          Press enter to search OpenStreetMap
                        </div>
                      )}
                      <div className="my-1 h-px bg-line" />
                      <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={locating}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bone"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-lime text-ink">
                          {locating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold text-ink">Use my location</span>
                          <span className="block font-mono text-[8px] text-muted">Browser GPS · one-off</span>
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {["Rotterdam", "Amsterdam", "Lisbon"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      const location = LOCATIONS.find((item) => item.name === city);
                      if (location) centerOn(location);
                    }}
                    className={cn(
                      "rounded-full border px-2 py-1 text-[8.5px] font-semibold transition-colors",
                      customPlace?.startsWith(city)
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-bone/60 text-muted hover:border-line-strong hover:text-ink",
                    )}
                  >
                    {city}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="flex items-center gap-1 rounded-full border border-line bg-bone/60 px-2 py-1 text-[8.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  <Crosshair size={9} />
                  Near me
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coordinates and map controls */}
        <div className="absolute right-2.5 top-2.5 z-30 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
          <div className="hidden items-center gap-2 rounded-full border border-line bg-paper/90 px-3 py-1.5 font-mono text-[9px] font-medium text-muted shadow-sm backdrop-blur sm:flex">
            <Compass size={11} className="text-ink/60" />
            {Math.abs(viewCoords.lat).toFixed(4)}° {viewCoords.lat >= 0 ? "N" : "S"}
            <span className="h-2.5 w-px bg-line" />
            {Math.abs(viewCoords.lng).toFixed(4)}° {viewCoords.lng >= 0 ? "E" : "W"}
            <span className="h-2.5 w-px bg-line" />
            Z{viewCoords.zoom}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                aria-label="Map layers"
                onClick={() => setLayersOpen((open) => !open)}
                aria-expanded={layersOpen}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border bg-paper/95 px-2.5 text-[10px] font-semibold text-ink shadow-sm backdrop-blur transition-colors hover:border-line-strong",
                  layersOpen ? "border-ink" : "border-line",
                )}
              >
                <Layers size={13} className="text-muted" />
                <span className="hidden sm:inline">Layers</span>
              </button>
              {layersOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close layers"
                    onClick={() => setLayersOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[228px] rounded-[16px] border border-line bg-paper p-3 shadow-float animate-pop">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[8px] font-semibold uppercase tracking-[.12em] text-muted">
                        Map layers
                      </span>
                      <span className="rounded bg-lime/50 px-1 py-0.5 font-mono text-[7px] uppercase text-ink/70">
                        OSM
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <label className="flex cursor-pointer items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10.5px] font-medium">
                          <Trees size={12} className="text-sage-deep" />
                          Player areas
                        </span>
                        <Toggle checked={showAreas} onChange={setShowAreas} label="Show player areas" />
                      </label>
                      <label className="flex cursor-pointer items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[10.5px] font-medium">
                          <Users size={12} className="text-sky" />
                          Players nearby
                        </span>
                        <Toggle checked={showPlayers} onChange={setShowPlayers} label="Show players" />
                      </label>
                    </div>
                    <div className="mt-3 rounded-lg bg-bone/70 px-2 py-1.5 text-[8.5px] leading-relaxed text-muted">
                      Raster tiles at z{viewCoords.zoom} · simulation overlay is client-side.
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              aria-label="Toggle fullscreen"
              onClick={requestFullscreen}
              className="hidden h-9 w-9 place-items-center rounded-full border border-line bg-paper/95 text-ink shadow-sm backdrop-blur transition-colors hover:border-line-strong sm:grid"
            >
              <Maximize2 size={13} />
            </button>
            <div className="hidden overflow-hidden rounded-full border border-line bg-paper/95 shadow-sm backdrop-blur sm:flex">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() =>
                  setMapLocation({ lat: viewCoords.lat, lng: viewCoords.lng, zoom: Math.min(19, viewCoords.zoom + 1) })
                }
                className="grid h-9 w-8 place-items-center border-r border-line text-ink transition-colors hover:bg-bone"
              >
                <Plus size={13} />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() =>
                  setMapLocation({ lat: viewCoords.lat, lng: viewCoords.lng, zoom: Math.max(3, viewCoords.zoom - 1) })
                }
                className="grid h-9 w-8 place-items-center text-ink transition-colors hover:bg-bone"
              >
                <Minus size={13} />
              </button>
            </div>
            <button
              type="button"
              aria-label="Toggle fullscreen"
              onClick={requestFullscreen}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper/95 text-ink shadow-sm backdrop-blur sm:hidden"
            >
              <Maximize2 size={13} />
            </button>
          </div>
          <span className="hidden rounded-full border border-line bg-paper/80 px-2 py-1 font-mono text-[7.5px] uppercase tracking-[.06em] text-muted backdrop-blur lg:block">
            Drag to pan · scroll to zoom
          </span>
        </div>

        {/* Selected area / uncharted panel */}
        <div className="absolute bottom-2.5 left-2.5 z-30 w-[min(360px,calc(100%-1.25rem))] sm:bottom-4 sm:left-4">
          {selectedArea ? (
            <Panel className="overflow-hidden border-line/80 bg-paper/95 shadow-float backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2 px-3.5 pb-0 pt-3">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-md text-ink"
                    style={{ background: selectedArea.accent }}
                  >
                    <Trees size={12} />
                  </span>
                  <span className="font-mono text-[8px] font-semibold uppercase tracking-[.1em] text-muted">
                    Player area · L{selectedArea.level}
                  </span>
                </div>
                <Badge tone="lime" dot>
                  Thriving
                </Badge>
              </div>
              <div className="px-3.5 pb-3 pt-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[22px] font-semibold leading-none tracking-[-0.04em]">
                      {selectedArea.name}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {selectedArea.city}, {selectedArea.country}
                      </span>
                      <span className="h-2.5 w-px bg-line" />
                      <span className="font-mono text-[8px] uppercase tracking-[.04em]">{selectedArea.lotCode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMapLocation({ ...selectedArea.coordinates, zoom: 16 });
                      setViewCoords({ ...selectedArea.coordinates, zoom: 16 });
                    }}
                    aria-label="Centre map on this area"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-paper text-muted transition-colors hover:text-ink"
                  >
                    <Crosshair size={12} />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-bone/35">
                  {[
                    { icon: Building2, value: selectedArea.buildings.length, label: "Buildings" },
                    { icon: Users, value: selectedArea.residents, label: "Residents" },
                    { icon: Heart, value: `${selectedArea.happiness}%`, label: "Happiness" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="px-2.5 py-2">
                        <div className="flex items-center gap-1 text-muted">
                          <Icon size={10} />
                          <span className="text-[8px] font-semibold uppercase tracking-[.04em]">{stat.label}</span>
                        </div>
                        <div className="mt-1 font-display text-[15px] font-semibold leading-none tracking-[-.02em] text-ink">
                          {stat.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <Button variant="lime" size="md" className="flex-1" onClick={enterSelectedArea}>
                    Enter area
                    <ArrowRight size={14} />
                  </Button>
                  <div className="flex -space-x-1.5 rounded-full border border-line bg-paper py-1 pl-1 pr-2">
                    {selectedArea.buildings.slice(0, 3).map((building) => (
                      <span
                        key={building.id}
                        className="grid h-6 w-6 place-items-center rounded-full border border-paper"
                        style={{ background: building.accentSoft, color: building.accent }}
                        title={building.name}
                      >
                        <Building2 size={10} />
                      </span>
                    ))}
                    <span className="ml-1.5 self-center font-mono text-[7.5px] text-muted">
                      {selectedArea.buildings.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line/70 px-3.5 py-1.5">
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[7.5px] font-medium text-muted hover:text-ink"
                >
                  © OpenStreetMap contributors
                </a>
                <span className="font-mono text-[7px] uppercase tracking-[.05em] text-muted-light">
                  tiles z{viewCoords.zoom}
                </span>
              </div>
            </Panel>
          ) : (
            <Panel className="overflow-hidden bg-paper/95 shadow-float backdrop-blur-xl">
              <div className="px-4 pb-4 pt-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-mono text-[8px] font-semibold uppercase tracking-[.1em] text-muted">
                    <span className="grid h-5 w-5 place-items-center rounded-md border border-dashed border-line-strong text-muted">
                      +
                    </span>
                    Uncharted ground
                  </span>
                  <Badge tone="outline">0 claims</Badge>
                </div>
                <h2 className="mt-2 font-display text-[21px] font-semibold leading-tight tracking-[-.04em]">
                  No player area here yet.
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  {customPlace ?? "This location"} is open OSM ground. Survey the block and your CTO will return with a buildable plot.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="lime"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      notify(
                        "Site survey requested",
                        "Vertex is checking zoning, access and the texture budget. Expect a brief in ~2 min.",
                        "lime",
                      )
                    }
                  >
                    <Navigation size={12} />
                    Survey location
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const primary = world.areas[0];
                      centerOn({
                        name: "Rotterdam",
                        region: "Netherlands",
                        lat: 51.9175,
                        lng: 4.481,
                        zoom: 14,
                      });
                      setSelectedAreaId(primary.id);
                    }}
                  >
                    Home
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line/70 px-4 py-1.5">
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[7.5px] font-medium text-muted hover:text-ink"
                >
                  © OpenStreetMap contributors
                </a>
                <span className="font-mono text-[7px] uppercase tracking-[.05em] text-muted-light">live tiles</span>
              </div>
            </Panel>
          )}
        </div>

        {/* Live world panel */}
        <div className="absolute bottom-4 right-4 z-30 hidden w-[270px] flex-col gap-2 lg:flex">
          <Panel className="overflow-hidden border-line/80 bg-paper/95 shadow-float backdrop-blur-xl">
            <div className="flex items-center justify-between px-3.5 pb-2 pt-3">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[.1em] text-muted">
                In this world right now
              </span>
              <span className="flex items-center gap-1 font-mono text-[8px] font-medium text-lime-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" />
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 pb-3">
              <div className="flex -space-x-2">
                {presence.slice(0, 5).map((player) => (
                  <span
                    key={player.id}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-paper font-display text-[9px] font-bold text-white"
                    style={{ background: player.color }}
                    title={`${player.name} · ${player.status === "You" ? "Shared player" : player.status}`}
                  >
                    {player.initials}
                  </span>
                ))}
              </div>
              <div className="ml-auto text-right">
                <div className="font-display text-[14px] font-semibold leading-none">5 people</div>
                <div className="mt-1 font-mono text-[7.5px] uppercase text-muted">near your grid</div>
              </div>
            </div>
            <div className="mx-3.5 mb-3 flex items-center justify-between rounded-lg border border-line bg-bone/40 px-2 py-1.5">
              <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.04em] text-muted">
                <span className="h-1 w-1 rounded-full bg-lime-deep" />
                60 fps · 24 draws
              </span>
              <span className="font-mono text-[8px] text-muted">18 ms</span>
            </div>
          </Panel>

          <Panel className="overflow-hidden border-line/80 bg-paper/95 shadow-float backdrop-blur-xl">
            <button
              type="button"
              onClick={() => navigate(`/user/${sharedPlayer.id}/ai/management`)}
              className="group flex w-full items-center justify-between gap-3 px-3.5 pb-2 pt-3 text-left"
            >
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[.1em] text-muted">
                AI crew on shift
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-ink transition-transform group-hover:translate-x-0.5">
                Manage <ArrowUpRight size={11} className="text-muted" />
              </span>
            </button>
            <div className="divide-y divide-line/70 border-t border-line/70">
              {world.bots.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => navigate(`/user/${sharedPlayer.id}/ai/management`)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-bone/40"
                >
                  <BotAvatar bot={bot} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[10.5px] font-bold text-ink">{bot.name}</span>
                      <span className="font-mono text-[7.5px] uppercase tracking-[.05em] text-muted">{bot.role}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[8.5px] text-muted">{bot.task}</span>
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      bot.status === "online" ? "bg-lime-deep" : "bg-muted-light",
                    )}
                  />
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden justify-center xl:flex">
          <div className="flex items-center gap-2 rounded-full border border-line bg-paper/85 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-muted shadow-sm backdrop-blur">
            <Compass size={10} />
            Rotterdam grid
            <span className="h-2.5 w-px bg-line" />
            {primaryArea.lotCode}
            <span className="h-2.5 w-px bg-line" />
            <span className="flex items-center gap-1 text-ink/70">
              <Check size={9} className="text-lime-deep" />
              synced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
