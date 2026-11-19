import type { AppUser, Area, Bot, Building, PlayerPresence, Room, RoomType, WorldState } from "../lib/types";

export const DEMO_PLAYER: AppUser = {
  id: "alex",
  name: "Alex Rivera",
  handle: "@alex.builds",
  initials: "AR",
  level: 24,
  title: "World builder",
};

const staff = (
  name: string,
  role: "Guard" | "Receptionist",
  shift: string,
  status: "on-duty" | "handoff" | "off-duty" = "on-duty",
) => ({
  name,
  initials: name
    .split(" ")
    .map((n) => n[0])
    .join(""),
  role,
  shift,
  status,
});

const room = (
  id: string,
  name: string,
  type: RoomType,
  area: number,
  x: number,
  y: number,
  w: number,
  h: number,
  status: Room["status"],
  occupants: number,
  staffName?: string,
): Room => ({ id, name, type, area, x, y, w, h, status, occupants, staff: staffName });

const foundry: Building = {
  id: "foundry-hall",
  name: "Foundry Hall",
  category: "Innovation studio",
  description:
    "The social heart of Delfshaven Yard. A cross-disciplinary maker floor with a street-facing welcome bar and a quiet research wing.",
  level: 4,
  accent: "#cf6d47",
  accentSoft: "#f8e4d9",
  roof: "#b8563a",
  plan: { x: 2, y: 2, w: 9, h: 6 },
  rooms: [
    room("reception", "Reception", "lobby", 32, 0, 0, 5, 4, "live", 3, "Iris Chen"),
    room("studio", "Studio Floor", "workspace", 96, 5, 0, 9, 8, "live", 18, "Jon Bell"),
    room("ops", "Ops Room", "security", 38, 14, 0, 6, 5, "live", 2, "Kai Mercer"),
    room("quiet", "Quiet Deck", "focus", 28, 0, 4, 5, 4, "ready", 4),
    room("kitchen", "Kitchenette", "social", 34, 14, 5, 6, 4, "live", 6),
    room("green-court", "Green Court", "garden", 58, 0, 8, 5, 6, "live", 5),
    room("makers", "Makers Lab", "workspace", 112, 5, 8, 15, 6, "setup", 0),
  ],
  guard: staff("Kai Mercer", "Guard", "18:00 – 02:00"),
  receptionist: staff("Iris Chen", "Receptionist", "08:00 – 16:00"),
  metrics: { efficiency: 92, power: 74, water: 61, footfall: 86 },
};

const greenhouse: Building = {
  id: "the-greenhouse",
  name: "The Greenhouse",
  category: "Community garden",
  description:
    "A productive glasshouse and seed library. Open to residents on weekdays with a small tea counter tucked behind the potting benches.",
  level: 3,
  accent: "#6f9a4f",
  accentSoft: "#e6efdb",
  roof: "#4f7d56",
  plan: { x: 14, y: 2, w: 7, h: 6 },
  rooms: [
    room("green-welcome", "Welcome Bench", "lobby", 20, 0, 0, 5, 4, "live", 1, "Lena Vos"),
    room("grow-lab", "Grow Lab", "garden", 88, 5, 0, 10, 9, "live", 7),
    room("potting", "Potting Studio", "workspace", 42, 15, 0, 5, 9, "live", 3),
    room("seed-lib", "Seed Library", "focus", 26, 0, 4, 5, 5, "ready", 2),
    room("tea", "Tea Corner", "social", 36, 5, 9, 10, 5, "live", 5),
    room("compost", "Compost Bay", "garden", 30, 15, 9, 5, 5, "ready", 0),
  ],
  guard: staff("Bo Anders", "Guard", "12:00 – 20:00", "handoff"),
  receptionist: staff("Lena Vos", "Receptionist", "09:00 – 17:00"),
  metrics: { efficiency: 87, power: 52, water: 91, footfall: 71 },
};

const pier: Building = {
  id: "pier-12-cafe",
  name: "Pier 12 Café",
  category: "Social club",
  description:
    "A low-slung waterside café with a deep timber terrace. Built for evening foot traffic and a very good oat flat white.",
  level: 2,
  accent: "#5c8ca4",
  accentSoft: "#e1edf2",
  roof: "#3f6f86",
  plan: { x: 3, y: 11, w: 10, h: 5 },
  rooms: [
    room("cafe", "Café Counter", "social", 64, 0, 0, 9, 6, "live", 11, "Mina Park"),
    room("cafe-kitchen", "Kitchen", "workspace", 38, 9, 0, 6, 6, "live", 4),
    room("terrace", "Terrace", "garden", 84, 0, 6, 15, 8, "live", 16),
    room("loft", "Loft Office", "meeting", 30, 15, 0, 5, 8, "ready", 1),
    room("store", "Dry Store", "focus", 18, 15, 8, 5, 6, "setup", 0),
  ],
  guard: staff("Tomas Rey", "Guard", "16:00 – 00:00"),
  receptionist: staff("Mina Park", "Receptionist", "10:00 – 18:00"),
  metrics: { efficiency: 79, power: 68, water: 55, footfall: 94 },
};

const lushLot = (accent: string, soft: string, roof: string, plan: Building["plan"]): Omit<Building, "rooms" | "guard" | "receptionist" | "name" | "description" | "category" | "id"> => ({
  level: 2,
  accent,
  accentSoft: soft,
  roof,
  plan,
  metrics: { efficiency: 81, power: 63, water: 58, footfall: 62 },
});

const compactBuilding = (
  id: string,
  name: string,
  category: string,
  description: string,
  palette: [string, string, string],
  plan: Building["plan"],
  roomSpecs: Array<[string, string, RoomType, number, number, number, number, number]>,
  staffNames: [string, string],
): Building => ({
  id,
  name,
  category,
  description,
  ...lushLot(palette[0], palette[1], palette[2], plan),
  rooms: roomSpecs.map(([rid, rname, type, area, x, y, w, h], i) =>
    room(rid, rname, type, area, x, y, w, h, i < 2 ? "live" : "ready", i === 0 ? 2 : 0, i === 0 ? staffNames[1] : undefined),
  ),
  guard: staff(staffNames[0], "Guard", "18:00 – 02:00"),
  receptionist: staff(staffNames[1], "Receptionist", "08:00 – 16:00"),
});

const canopyHouse = compactBuilding(
  "canopy-house",
  "Canopy House",
  "Residential co-op",
  "A timber-framed residence wrapped around a mature plane tree. Four households, one shared kitchen.",
  ["#a8834e", "#f2e8d5", "#8c6c3e"],
  { x: 13, y: 3, w: 8, h: 6 },
  [
    ["canopy-welcome", "Entry Lounge", "lobby", 34, 0, 0, 6, 5],
    ["canopy-kitchen", "Shared Kitchen", "social", 56, 6, 0, 9, 6],
    ["canopy-loft", "North Loft", "focus", 42, 0, 5, 7, 6],
    ["canopy-yard", "Garden Yard", "garden", 64, 7, 6, 8, 5],
  ],
  ["Owen Vale", "June Park"],
);

const orchard = compactBuilding(
  "the-orchard",
  "The Orchard",
  "Neighborhood garden",
  "Raised beds, eleven apple trees, and a tiny tool library at the edge of Kralingen Green.",
  ["#779650", "#e6eedb", "#5c7d4d"],
  { x: 3, y: 10, w: 8, h: 5 },
  [
    ["orchard-welcome", "Tool Shed", "lobby", 18, 0, 0, 4, 4],
    ["orchard-beds", "Raised Beds", "garden", 92, 4, 0, 11, 9],
    ["orchard-shed", "Potting Shed", "workspace", 28, 15, 0, 5, 5],
    ["orchard-circle", "Fire Circle", "social", 40, 15, 5, 5, 4],
  ],
  ["Piet Maas", "Sana Ali"],
);

const dockStudio = compactBuilding(
  "dock-7-studio",
  "Dock 7 Studio",
  "Film workshop",
  "An old harbor warehouse for set building, sound work, and the occasional very loud screening.",
  ["#c7665a", "#f7e3df", "#a34f4a"],
  { x: 12, y: 2, w: 9, h: 7 },
  [
    ["dock-entry", "Call Sheet Desk", "lobby", 26, 0, 0, 5, 4],
    ["dock-stage", "Sound Stage", "workspace", 128, 5, 0, 10, 10],
    ["dock-edit", "Edit Suites", "focus", 44, 15, 0, 5, 6],
    ["dock-prop", "Prop Store", "security", 56, 0, 4, 5, 6],
    ["dock-canteen", "Crew Canteen", "social", 48, 15, 6, 5, 4],
  ],
  ["Rafi Khan", "Nora Lind"],
);

const harborExchange = compactBuilding(
  "harbor-exchange",
  "Harbor Exchange",
  "Market hall",
  "A covered market with eighteen stalls, a parcel desk, and the best view of the water on this side of the Maas.",
  ["#5d899d", "#e1edf1", "#467083"],
  { x: 3, y: 10, w: 10, h: 6 },
  [
    ["market-desk", "Parcel Desk", "lobby", 30, 0, 0, 6, 4],
    ["market-hall", "Market Hall", "social", 116, 6, 0, 9, 9],
    ["market-cold", "Cold Store", "security", 38, 15, 0, 5, 5],
    ["market-kitchen", "Food Lab", "workspace", 52, 0, 4, 6, 5],
    ["market-office", "Office", "focus", 28, 15, 5, 5, 4],
  ],
  ["Ilyas Demir", "Greta Sun"],
);

const craneLoft = compactBuilding(
  "crane-loft",
  "Crane Loft",
  "Live / work residence",
  "A two-bedroom loft in the old crane house. The living room hangs over the water and the workshop sits below.",
  ["#9d83c2", "#ece4f6", "#8066a5"],
  { x: 14, y: 10, w: 7, h: 5 },
  [
    ["crane-entry", "Entry Hall", "lobby", 22, 0, 0, 5, 4],
    ["crane-living", "Living Room", "social", 62, 5, 0, 10, 6],
    ["crane-work", "Lower Workshop", "workspace", 48, 0, 4, 7, 6],
    ["crane-sleep", "Sleeping Loft", "focus", 40, 7, 6, 8, 5],
  ],
  ["Mika Tor", "Elise Ward"],
);

const oasisPavilion = compactBuilding(
  "oasis-pavilion",
  "Oasis Pavilion",
  "Community hall",
  "A bright, plant-filled hall for residents to meet, make, and eat together. The roof harvests all of its own water.",
  ["#9caf46", "#eef3d4", "#7b8f35"],
  { x: 7, y: 5, w: 10, h: 7 },
  [
    ["oasis-welcome", "Front of House", "lobby", 36, 0, 0, 5, 4],
    ["oasis-hall", "Assembly Hall", "social", 132, 5, 0, 10, 9],
    ["oasis-kitchen", "Community Kitchen", "workspace", 58, 15, 0, 5, 6],
    ["oasis-room", "Meeting Nook", "meeting", 30, 0, 4, 5, 6],
    ["oasis-garden", "Winter Garden", "garden", 70, 15, 6, 5, 4],
  ],
  ["Sem Aydin", "Nina Cho"],
);

const delfshavenPolygon = [
  { lat: 51.9182, lng: 4.4491 },
  { lat: 51.9188, lng: 4.4564 },
  { lat: 51.9149, lng: 4.4586 },
  { lat: 51.9137, lng: 4.4527 },
  { lat: 51.9151, lng: 4.4482 },
];

const AREAS: Area[] = [
  {
    id: "delfshaven-yard",
    name: "Delfshaven Yard",
    city: "Rotterdam",
    country: "Netherlands",
    district: "Delfshaven",
    coordinates: { lat: 51.9162, lng: 4.4534 },
    zoom: 17,
    polygon: delfshavenPolygon,
    level: 12,
    xp: 6840,
    xpNext: 8200,
    residents: 128,
    happiness: 94,
    income: 8420,
    energy: 76,
    lotCode: "NL-042-D",
    accent: "#c9f95f",
    accentSoft: "#eefad9",
    description:
      "A former shipyard turned living neighborhood. Three buildings share one sunny courtyard, fed by a small district energy loop and a lot of carefully placed trees.",
    buildings: [foundry, greenhouse, pier],
  },
  {
    id: "kralingen-green",
    name: "Kralingen Green",
    city: "Rotterdam",
    country: "Netherlands",
    district: "Kralingen",
    coordinates: { lat: 51.9259, lng: 4.5104 },
    zoom: 17,
    polygon: [
      { lat: 51.927, lng: 4.5058 },
      { lat: 51.9273, lng: 4.5143 },
      { lat: 51.9248, lng: 4.5151 },
      { lat: 51.9241, lng: 4.5069 },
    ],
    level: 8,
    xp: 3610,
    xpNext: 5000,
    residents: 64,
    happiness: 97,
    income: 3180,
    energy: 88,
    lotCode: "NL-118-K",
    accent: "#a8d850",
    accentSoft: "#e9f3d8",
    description:
      "A green residential edge where the city softens into the park. The orchard is shared, the kitchen is bigger than the bedrooms, and everyone knows the compost rota.",
    buildings: [canopyHouse, orchard],
  },
  {
    id: "katendrecht-docks",
    name: "Katendrecht Docks",
    city: "Rotterdam",
    country: "Netherlands",
    district: "Katendrecht",
    coordinates: { lat: 51.9031, lng: 4.4906 },
    zoom: 17,
    polygon: [
      { lat: 51.9058, lng: 4.4852 },
      { lat: 51.9054, lng: 4.4958 },
      { lat: 51.901, lng: 4.4951 },
      { lat: 51.9002, lng: 4.4861 },
    ],
    level: 16,
    xp: 10480,
    xpNext: 12000,
    residents: 212,
    happiness: 86,
    income: 12400,
    energy: 69,
    lotCode: "NL-207-Q",
    accent: "#8bc5df",
    accentSoft: "#e3f1f7",
    description:
      "The working, watching, eating edge of the harbor. A film studio, a market hall and a crane loft share the quay with container traffic and a lot of seagulls.",
    buildings: [dockStudio, harborExchange, craneLoft],
  },
  {
    id: "noord-oasis",
    name: "Noord Oasis",
    city: "Rotterdam",
    country: "Netherlands",
    district: "Noord",
    coordinates: { lat: 51.9318, lng: 4.4688 },
    zoom: 17,
    polygon: [
      { lat: 51.9346, lng: 4.4625 },
      { lat: 51.9341, lng: 4.4728 },
      { lat: 51.9301, lng: 4.4733 },
      { lat: 51.9297, lng: 4.4631 },
    ],
    level: 6,
    xp: 2280,
    xpNext: 4000,
    residents: 39,
    happiness: 91,
    income: 1960,
    energy: 94,
    lotCode: "NL-009-N",
    accent: "#d4c7f2",
    accentSoft: "#f0eaf9",
    description:
      "A small pavilion with a big garden. It rains, it harvests, and on Fridays the whole neighborhood fits inside the assembly hall, approximately.",
    buildings: [oasisPavilion],
  },
];

const basePrompt =
  "You are {name}, the {role} bot for Simplayz player @alex.builds.\n\n" +
  "Mission: keep the player's world visually ambitious and operationally sound.\n" +
  "Constraints: reason against the published runtime budget; flag any request that exceeds 25k triangles, 40 draw calls, or 64 MB of texture memory per area. Never invent asset IDs.\n\n" +
  "Output contract: respond with a numbered decision brief (max 140 words). End with a single JSON block {decision, risk, next_action}. State your confidence from 0–100.";

const BOTS: Bot[] = [
  {
    id: "cto",
    name: "Vertex",
    role: "CTO",
    title: "Technical director",
    tagline: "Shaders, asset pipeline, engine reality.",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    temperature: 0.3,
    systemPrompt: basePrompt.replace("{name}", "Vertex").replace("{role}", "CTO"),
    promptVersion: "v3.2",
    status: "online",
    task: "Auditing Foundry Hall's room graph for mobile draw calls",
    tokensToday: 18420,
    monthlySpend: 68.4,
    accent: "#cf6d47",
    accentSoft: "#f8e4d9",
    responseFormat: "Structured JSON",
  },
  {
    id: "cfo",
    name: "Ledger",
    role: "CFO",
    title: "Economics officer",
    tagline: "Cashflow, upkeep, and the cost of ambition.",
    provider: "openai",
    model: "gpt-5",
    temperature: 0.2,
    systemPrompt: basePrompt.replace("{name}", "Ledger").replace("{role}", "CFO"),
    promptVersion: "v2.7",
    status: "online",
    task: "Reconciling district upkeep against today's footfall",
    tokensToday: 12180,
    monthlySpend: 42.9,
    accent: "#5c8ca4",
    accentSoft: "#e1edf2",
    responseFormat: "Markdown brief",
  },
  {
    id: "coo",
    name: "Mira",
    role: "COO",
    title: "Operations lead",
    tagline: "Staff rotations, rooms, residents, resilience.",
    provider: "google",
    model: "gemini-2-5-pro",
    temperature: 0.4,
    systemPrompt: basePrompt.replace("{name}", "Mira").replace("{role}", "COO"),
    promptVersion: "v4.0",
    status: "online",
    task: "Balancing the late guard handoff at The Greenhouse",
    tokensToday: 9670,
    monthlySpend: 37.6,
    accent: "#8fa83e",
    accentSoft: "#eef3d4",
    responseFormat: "Table",
  },
];

const ACTIVITY: WorldState["activity"] = [
  { id: "a1", bot: "cto", title: "Room graph optimized", detail: "Merged 3 draw calls in Foundry Hall · LOD1 verified at 18.4k tris", time: "2m ago", tone: "coral" },
  { id: "a2", bot: "coo", title: "Guard handoff covered", detail: "Bo Anders moved to 20:00 handoff. Minimum staffing retained at The Greenhouse.", time: "18m ago", tone: "lime" },
  { id: "a3", bot: "cfo", title: "Upkeep forecast updated", detail: "Delfshaven Yard projected at 6,840 credits/week. Within the 7,200 cap.", time: "46m ago", tone: "sky" },
  { id: "a4", bot: "system", title: "Layout revision published", detail: "Makers Lab added to Foundry Hall. Player approval recorded.", time: "1h ago", tone: "neutral" },
  { id: "a5", bot: "cto", title: "Texture budget warning cleared", detail: "BC7 override confirmed on 4 environment maps · 41.8 MB total", time: "2h ago", tone: "neutral" },
];

export const DEMO_WORLD: WorldState = {
  areas: AREAS,
  bots: BOTS,
  activity: ACTIVITY,
  budget: { monthly: 1200, used: 428.7, tokenCap: 5000000, tokenUsed: 2132000 },
  routingRules: { fallback: true, costGuard: true, requireApproval: false },
};

export const DEMO_PRESENCE: PlayerPresence[] = [
  { id: "p1", name: "Alex Rivera", initials: "AR", color: "#cf6d47", status: "You", lat: 51.9183, lng: 4.4795 },
  { id: "p2", name: "Jun Park", initials: "JP", color: "#5c8ca4", status: "Building", lat: 51.9212, lng: 4.4742 },
  { id: "p3", name: "Mara Ott", initials: "MO", color: "#8fa83e", status: "Visiting", lat: 51.9137, lng: 4.4818 },
  { id: "p4", name: "Theo Lin", initials: "TL", color: "#9d83c2", status: "Exploring", lat: 51.9169, lng: 4.4902 },
  { id: "p5", name: "Nia Cole", initials: "NC", color: "#c98838", status: "Building", lat: 51.9104, lng: 4.4665 },
];
