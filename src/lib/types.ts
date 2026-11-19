export type LatLng = { lat: number; lng: number };

export type RoomType =
  | "lobby"
  | "workspace"
  | "security"
  | "social"
  | "focus"
  | "garden"
  | "meeting";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  area: number;
  x: number;
  y: number;
  w: number;
  h: number;
  status: "live" | "ready" | "setup";
  occupants: number;
  staff?: string;
}

export interface StaffMember {
  name: string;
  initials: string;
  role: "Guard" | "Receptionist";
  shift: string;
  status: "on-duty" | "handoff" | "off-duty";
}

export interface Building {
  id: string;
  name: string;
  category: string;
  description: string;
  level: number;
  accent: string;
  accentSoft: string;
  roof: string;
  rooms: Room[];
  guard: StaffMember;
  receptionist: StaffMember;
  metrics: {
    efficiency: number;
    power: number;
    water: number;
    footfall: number;
  };
  plan: { x: number; y: number; w: number; h: number };
}

export interface Area {
  id: string;
  name: string;
  city: string;
  country: string;
  district: string;
  coordinates: LatLng;
  zoom: number;
  polygon: LatLng[];
  level: number;
  xp: number;
  xpNext: number;
  residents: number;
  happiness: number;
  income: number;
  energy: number;
  lotCode: string;
  accent: string;
  accentSoft: string;
  description: string;
  buildings: Building[];
}

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "mistral"
  | "groq"
  | "local";

export interface Provider {
  id: ProviderId;
  name: string;
  mark: string;
  color: string;
  soft: string;
  connected: boolean;
  region: string;
}

export interface AiModel {
  id: string;
  provider: ProviderId;
  name: string;
  tier: string;
  context: string;
  inputCost: number;
  outputCost: number;
  latency: number;
  badge?: string;
}

export interface Bot {
  id: "cto" | "cfo" | "coo";
  name: string;
  role: "CTO" | "CFO" | "COO";
  title: string;
  tagline: string;
  provider: ProviderId;
  model: string;
  temperature: number;
  systemPrompt: string;
  promptVersion: string;
  status: "online" | "paused";
  task: string;
  tokensToday: number;
  monthlySpend: number;
  accent: string;
  accentSoft: string;
  responseFormat: "Structured JSON" | "Markdown brief" | "Table";
}

export interface ActivityEntry {
  id: string;
  bot: "cto" | "cfo" | "coo" | "system";
  title: string;
  detail: string;
  time: string;
  tone: "lime" | "sky" | "coral" | "neutral";
}

export interface WorldState {
  areas: Area[];
  bots: Bot[];
  activity: ActivityEntry[];
  budget: {
    monthly: number;
    used: number;
    tokenCap: number;
    tokenUsed: number;
  };
  routingRules: {
    fallback: boolean;
    costGuard: boolean;
    requireApproval: boolean;
  };
}

export interface AppUser {
  id: string;
  name: string;
  handle: string;
  initials: string;
  level: number;
  title: string;
}

export interface PlayerPresence extends LatLng {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: string;
}

export interface PlayerSnapshot {
  player: AppUser;
  presence: PlayerPresence[];
  world: WorldState;
  revision: number;
}
