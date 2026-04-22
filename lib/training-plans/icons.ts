import type { LucideIcon } from "lucide-react";
import {
  Code2,
  FlaskConical,
  Layers,
  Lightbulb,
  PenTool,
  Shield,
  ShieldCheck,
} from "lucide-react";

import type { GateType, Subcompetence } from "@/lib/training-plans/types";

/**
 * Map a subcompetence (by name or hex color) to a lucide icon + readable
 * light/dark colors. The raw subcompetence colors are used in dark mode.
 * In light mode we swap in darker shades so icons like Development
 * (#DBFD6B) are not invisible on white surfaces.
 */
export type SubcompetenceIconInfo = {
  Icon: LucideIcon;
  colorLight: string;
  colorDark: string;
};

export function getSubcompetenceIcon(
  sc: Pick<Subcompetence, "name" | "color"> | null | undefined
): SubcompetenceIconInfo {
  const name = (sc?.name ?? "").toLowerCase();
  const color = (sc?.color ?? "").toLowerCase();

  if (
    name.includes("development") ||
    color === "#22c55e" ||
    color === "#dbfd6b"
  ) {
    return { Icon: Code2, colorLight: "#166534", colorDark: "#22c55e" };
  }
  if (name.includes("analysis") || name.includes("design") || color === "#7c6af7") {
    return { Icon: PenTool, colorLight: "#5b47e0", colorDark: "#7C6AF7" };
  }
  if (name.includes("testing") || color === "#00a878") {
    return { Icon: FlaskConical, colorLight: "#007a58", colorDark: "#00a878" };
  }
  if (name.includes("transversal") || color === "#fb923c") {
    return { Icon: Lightbulb, colorLight: "#c45e00", colorDark: "#FB923C" };
  }
  return { Icon: Layers, colorLight: "#374151", colorDark: "#EAF2EF" };
}

export function getGateIcon(type: GateType): {
  Icon: LucideIcon;
  size: number;
  cssColorVar: string;
} {
  if (type === "phase_gate") {
    return {
      Icon: ShieldCheck,
      size: 18,
      cssColorVar: "var(--color-positive)",
    };
  }
  return { Icon: Shield, size: 16, cssColorVar: "var(--color-accent)" };
}
