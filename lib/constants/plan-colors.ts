export type PlanColorKey =
  | "mint"
  | "iris"
  | "coral"
  | "gold"
  | "purple"
  | "teal";

export type PlanColorTokens = {
  label: string;
  border: string;
  bg: string;
  bgStrong: string;
  chip: string;
  chipBorder: string;
  chipText: string;
  accent: string;
  accentHover: string;
  glow: string;
  gradient: string;
};

export const PLAN_COLORS: Record<PlanColorKey, PlanColorTokens> = {
  mint: {
    label: "Mint",
    border: "#1DBF8A",
    bg: "rgba(29,191,138,0.06)",
    bgStrong: "rgba(29,191,138,0.12)",
    chip: "rgba(29,191,138,0.10)",
    chipBorder: "rgba(29,191,138,0.35)",
    chipText: "#0A7A52",
    accent: "#1DBF8A",
    accentHover: "#17A87A",
    glow: "rgba(29,191,138,0.15)",
    gradient: "linear-gradient(90deg, #1DBF8A, #34c99a)",
  },
  iris: {
    label: "Iris",
    border: "#6385FF",
    bg: "rgba(99,133,255,0.06)",
    bgStrong: "rgba(99,133,255,0.12)",
    chip: "rgba(99,133,255,0.10)",
    chipBorder: "rgba(99,133,255,0.35)",
    chipText: "#3f5bd8",
    accent: "#6385FF",
    accentHover: "#4f6fe6",
    glow: "rgba(99,133,255,0.15)",
    gradient: "linear-gradient(90deg, #6385FF, #a78bfa)",
  },
  coral: {
    label: "Coral",
    border: "#FF7B54",
    bg: "rgba(255,123,84,0.06)",
    bgStrong: "rgba(255,123,84,0.12)",
    chip: "rgba(255,123,84,0.10)",
    chipBorder: "rgba(255,123,84,0.35)",
    chipText: "#B8390A",
    accent: "#FF7B54",
    accentHover: "#E96A45",
    glow: "rgba(255,123,84,0.15)",
    gradient: "linear-gradient(90deg, #FF7B54, #FFD166)",
  },
  gold: {
    label: "Gold",
    border: "#FFD166",
    bg: "rgba(255,209,102,0.10)",
    bgStrong: "rgba(255,209,102,0.18)",
    chip: "rgba(255,209,102,0.18)",
    chipBorder: "rgba(255,209,102,0.40)",
    chipText: "#7A5A00",
    accent: "#FFD166",
    accentHover: "#FFAA33",
    glow: "rgba(255,209,102,0.18)",
    gradient: "linear-gradient(90deg, #FFD166, #FFAA33)",
  },
  purple: {
    label: "Purple",
    border: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    bgStrong: "rgba(167,139,250,0.12)",
    chip: "rgba(167,139,250,0.10)",
    chipBorder: "rgba(167,139,250,0.35)",
    chipText: "#5b47e0",
    accent: "#a78bfa",
    accentHover: "#7C6AF7",
    glow: "rgba(167,139,250,0.15)",
    gradient: "linear-gradient(90deg, #a78bfa, #7C6AF7)",
  },
  teal: {
    label: "Teal",
    border: "#34c99a",
    bg: "rgba(52,201,154,0.06)",
    bgStrong: "rgba(52,201,154,0.12)",
    chip: "rgba(52,201,154,0.10)",
    chipBorder: "rgba(52,201,154,0.35)",
    chipText: "#0D5A46",
    accent: "#34c99a",
    accentHover: "#0D5A46",
    glow: "rgba(52,201,154,0.15)",
    gradient: "linear-gradient(90deg, #34c99a, #0D5A46)",
  },
};

export const PLAN_COLOR_KEYS: PlanColorKey[] = [
  "mint",
  "iris",
  "coral",
  "gold",
  "purple",
  "teal",
];

export function isPlanColor(v: unknown): v is PlanColorKey {
  return (
    typeof v === "string" &&
    (v === "mint" ||
      v === "iris" ||
      v === "coral" ||
      v === "gold" ||
      v === "purple" ||
      v === "teal")
  );
}

export function resolvePlanColor(v: unknown): PlanColorKey {
  if (isPlanColor(v)) return v;
  if (v === "red" || v === "orange") return "coral";
  if (v === "blue") return "iris";
  if (v === "yellow") return "gold";
  if (v === "green") return "mint";
  return "iris";
}
