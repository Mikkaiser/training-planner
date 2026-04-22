export type PlanColorKey =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "purple"
  | "orange";

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
};

export const PLAN_COLORS: Record<PlanColorKey, PlanColorTokens> = {
  red: {
    label: "Red",
    border: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    bgStrong: "rgba(239,68,68,0.12)",
    chip: "rgba(239,68,68,0.10)",
    chipBorder: "rgba(239,68,68,0.35)",
    chipText: "#b91c1c",
    accent: "#dc2626",
    accentHover: "#b91c1c",
    glow: "rgba(239,68,68,0.15)",
  },
  blue: {
    label: "Blue",
    border: "#3b82f6",
    bg: "rgba(59,130,246,0.06)",
    bgStrong: "rgba(59,130,246,0.12)",
    chip: "rgba(59,130,246,0.10)",
    chipBorder: "rgba(59,130,246,0.35)",
    chipText: "#1d4ed8",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    glow: "rgba(59,130,246,0.15)",
  },
  yellow: {
    label: "Yellow",
    border: "#eab308",
    bg: "rgba(234,179,8,0.06)",
    bgStrong: "rgba(234,179,8,0.12)",
    chip: "rgba(234,179,8,0.10)",
    chipBorder: "rgba(234,179,8,0.35)",
    chipText: "#854d0e",
    accent: "#ca8a04",
    accentHover: "#a16207",
    glow: "rgba(234,179,8,0.15)",
  },
  green: {
    label: "Green",
    border: "#22c55e",
    bg: "rgba(34,197,94,0.06)",
    bgStrong: "rgba(34,197,94,0.12)",
    chip: "rgba(34,197,94,0.10)",
    chipBorder: "rgba(34,197,94,0.35)",
    chipText: "#15803d",
    accent: "#16a34a",
    accentHover: "#15803d",
    glow: "rgba(34,197,94,0.15)",
  },
  purple: {
    label: "Purple",
    border: "#a855f7",
    bg: "rgba(168,85,247,0.06)",
    bgStrong: "rgba(168,85,247,0.12)",
    chip: "rgba(168,85,247,0.10)",
    chipBorder: "rgba(168,85,247,0.35)",
    chipText: "#7e22ce",
    accent: "#9333ea",
    accentHover: "#7e22ce",
    glow: "rgba(168,85,247,0.15)",
  },
  orange: {
    label: "Orange",
    border: "#f97316",
    bg: "rgba(249,115,22,0.06)",
    bgStrong: "rgba(249,115,22,0.12)",
    chip: "rgba(249,115,22,0.10)",
    chipBorder: "rgba(249,115,22,0.35)",
    chipText: "#c2410c",
    accent: "#ea580c",
    accentHover: "#c2410c",
    glow: "rgba(249,115,22,0.15)",
  },
};

export const PLAN_COLOR_KEYS: PlanColorKey[] = [
  "red",
  "blue",
  "yellow",
  "green",
  "purple",
  "orange",
];

export function isPlanColor(v: unknown): v is PlanColorKey {
  return (
    typeof v === "string" &&
    (v === "red" ||
      v === "blue" ||
      v === "yellow" ||
      v === "green" ||
      v === "purple" ||
      v === "orange")
  );
}

export function resolvePlanColor(v: unknown): PlanColorKey {
  return isPlanColor(v) ? v : "blue";
}
