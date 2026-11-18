import type {
  AiModel,
  Area,
  Bot,
  Building,
  Provider,
  Room,
  RoomType,
  WorldState,
} from "./types";

export const USER = {
  id: "alex",
  name: "Alex Rivera",
  handle: "@alex.builds",
  initials: "AR",
  level: 24,
  title: "World builder",
};

export const ROOM_STYLES: Record<
  RoomType,
  { label: string; color: string; soft: string; floor: string }
> = {
  lobby: { label: "Welcome", color: "#c96a43", soft: "#f9e3d8", floor: "#f2d4c5" },
  workspace: { label: "Workspace", color: "#778f36", soft: "#eaf1d2", floor: "#e0e9c2" },
  security: { label: "Security", color: "#4b79a8", soft: "#dfeaf6", floor: "#d4e3f1" },
  social: { label: "Social", color: "#be7f23", soft: "#f8ecd3", floor: "#f4e4c7" },
  focus: { label: "Focus", color: "#7d6aa8", soft: "#ece5f7", floor: "#e3daf1" },
  garden: { label: "Garden", color: "#4d8a5e", soft: "#dfedda", floor: "#d3e7ce" },
  meeting: { label: "Meeting", color: "#4d8787", soft: "#dceced", floor: "#cfe4e5" },
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

export const AREAS: Area[] = [
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

export const BOTS: Bot[] = [
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

export const PROVIDERS: Provider[] = [
  { id: "openai", name: "OpenAI", mark: "✳", color: "#171d1a", soft: "#ecebe5", connected: true, region: "US · global" },
  { id: "anthropic", name: "Anthropic", mark: "A", color: "#c96a43", soft: "#f8e4d9", connected: true, region: "US · EU" },
  { id: "google", name: "Google", mark: "G", color: "#4f7fc4", soft: "#e6eefb", connected: true, region: "global" },
  { id: "xai", name: "xAI", mark: "x", color: "#252b28", soft: "#e8e8e3", connected: true, region: "US" },
  { id: "mistral", name: "Mistral", mark: "M", color: "#c98838", soft: "#f8ecd9", connected: true, region: "EU" },
  { id: "groq", name: "Groq", mark: "g", color: "#c45e47", soft: "#f8e4df", connected: true, region: "US" },
  { id: "local", name: "Local", mark: "◈", color: "#6b8745", soft: "#eaf0e0", connected: true, region: "self-hosted" },
];

export const MODELS: AiModel[] = [
  { id: "gpt-5", provider: "openai", name: "GPT-5", tier: "Flagship reasoning", context: "400K", inputCost: 1.25, outputCost: 10, latency: 820, badge: "Best all-round" },
  { id: "gpt-4-1-mini", provider: "openai", name: "GPT-4.1 mini", tier: "Fast reasoning", context: "1M", inputCost: 0.4, outputCost: 1.6, latency: 410 },
  { id: "claude-opus-4-1", provider: "anthropic", name: "Claude Opus 4.1", tier: "Deep reasoning", context: "200K", inputCost: 15, outputCost: 75, latency: 1100, badge: "Sharpest" },
  { id: "claude-sonnet-4-5", provider: "anthropic", name: "Claude Sonnet 4.5", tier: "Balanced agent", context: "200K", inputCost: 3, outputCost: 15, latency: 640, badge: "Recommended" },
  { id: "claude-haiku-3-5", provider: "anthropic", name: "Claude Haiku 3.5", tier: "High throughput", context: "200K", inputCost: 0.8, outputCost: 4, latency: 280 },
  { id: "gemini-2-5-pro", provider: "google", name: "Gemini 2.5 Pro", tier: "Multimodal reasoning", context: "1M", inputCost: 1.25, outputCost: 10, latency: 780, badge: "Long context" },
  { id: "gemini-2-5-flash", provider: "google", name: "Gemini 2.5 Flash", tier: "Low latency", context: "1M", inputCost: 0.3, outputCost: 2.5, latency: 320 },
  { id: "grok-4", provider: "xai", name: "Grok 4", tier: "Frontier reasoning", context: "256K", inputCost: 3, outputCost: 15, latency: 890 },
  { id: "mistral-large-2", provider: "mistral", name: "Mistral Large 2", tier: "EU sovereign", context: "128K", inputCost: 2, outputCost: 6, latency: 610 },
  { id: "mistral-medium-3", provider: "mistral", name: "Mistral Medium 3", tier: "Cost efficient", context: "128K", inputCost: 0.4, outputCost: 2, latency: 370 },
  { id: "llama-3-3-70b", provider: "groq", name: "Llama 3.3 70B", tier: "Ultra low latency", context: "128K", inputCost: 0.59, outputCost: 0.79, latency: 190 },
  { id: "qwen-3-32b", provider: "local", name: "Qwen 3 32B", tier: "Local inference", context: "128K", inputCost: 0, outputCost: 0, latency: 240, badge: "Private" },
];

export const ACTIVITY: WorldState["activity"] = [
  { id: "a1", bot: "cto", title: "Room graph optimized", detail: "Merged 3 draw calls in Foundry Hall · LOD1 verified at 18.4k tris", time: "2m ago", tone: "coral" },
  { id: "a2", bot: "coo", title: "Guard handoff covered", detail: "Bo Anders moved to 20:00 handoff. Minimum staffing retained at The Greenhouse.", time: "18m ago", tone: "lime" },
  { id: "a3", bot: "cfo", title: "Upkeep forecast updated", detail: "Delfshaven Yard projected at 6,840 credits/week. Within the 7,200 cap.", time: "46m ago", tone: "sky" },
  { id: "a4", bot: "system", title: "Layout revision published", detail: "Makers Lab added to Foundry Hall. Player approval recorded.", time: "1h ago", tone: "neutral" },
  { id: "a5", bot: "cto", title: "Texture budget warning cleared", detail: "BC7 override confirmed on 4 environment maps · 41.8 MB total", time: "2h ago", tone: "neutral" },
];

export const WORLD: WorldState = {
  areas: AREAS,
  bots: BOTS,
  activity: ACTIVITY,
  budget: { monthly: 1200, used: 428.7, tokenCap: 5000000, tokenUsed: 2132000 },
  routingRules: { fallback: true, costGuard: true, requireApproval: false },
};

export const PLAYER_PRESENCE = [
  { id: "p1", name: "Alex Rivera", initials: "AR", color: "#cf6d47", status: "You", lat: 51.9183, lng: 4.4795 },
  { id: "p2", name: "Jun Park", initials: "JP", color: "#5c8ca4", status: "Building", lat: 51.9212, lng: 4.4742 },
  { id: "p3", name: "Mara Ott", initials: "MO", color: "#8fa83e", status: "Visiting", lat: 51.9137, lng: 4.4818 },
  { id: "p4", name: "Theo Lin", initials: "TL", color: "#9d83c2", status: "Exploring", lat: 51.9169, lng: 4.4902 },
  { id: "p5", name: "Nia Cole", initials: "NC", color: "#c98838", status: "Building", lat: 51.9104, lng: 4.4665 },
];

export const LOCATIONS = [
  { name: "Rotterdam", region: "Netherlands", lat: 51.9225, lng: 4.4792, zoom: 13 },
  { name: "Amsterdam", region: "Netherlands", lat: 52.3676, lng: 4.9041, zoom: 13 },
  { name: "Utrecht", region: "Netherlands", lat: 52.0907, lng: 5.1214, zoom: 13 },
  { name: "Lisbon", region: "Portugal", lat: 38.7223, lng: -9.1393, zoom: 13 },
  { name: "Barcelona", region: "Spain", lat: 41.3874, lng: 2.1686, zoom: 13 },
  { name: "Berlin", region: "Germany", lat: 52.52, lng: 13.405, zoom: 13 },
  { name: "Copenhagen", region: "Denmark", lat: 55.6761, lng: 12.5683, zoom: 13 },
  { name: "London", region: "United Kingdom", lat: 51.5072, lng: -0.1276, zoom: 13 },
  { name: "New York", region: "United States", lat: 40.7128, lng: -74.006, zoom: 12 },
  { name: "San Francisco", region: "United States", lat: 37.7749, lng: -122.4194, zoom: 13 },
  { name: "Tokyo", region: "Japan", lat: 35.6762, lng: 139.6503, zoom: 12 },
  { name: "Seoul", region: "South Korea", lat: 37.5665, lng: 126.978, zoom: 12 },
];

export const ASSET_BUDGET = [
  { label: "Triangles", value: 48200, cap: 80000, unit: "" },
  { label: "Draw calls", value: 24, cap: 40, unit: "" },
  { label: "Texture memory", value: 41.8, cap: 64, unit: " MB" },
  { label: "Particles / overdraw", value: 120, cap: 512, unit: "" },
];

export const getArea = (areas: Area[], areaId: string) =>
  areas.find((area) => area.id === areaId);

export const getBuilding = (areas: Area[], areaId: string, buildingId: string) =>
  getArea(areas, areaId)?.buildings.find((building) => building.id === buildingId);
