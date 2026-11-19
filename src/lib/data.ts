import type { AiModel, Provider, RoomType } from "./types";

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
