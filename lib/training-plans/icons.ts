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
 * Map a subcompetence (by name or hex color) to a lucide icon and a readable
 * light-mode color.
 */
export type SubcompetenceIconInfo = {
  Icon: LucideIcon;
  color: string;
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
    return { Icon: Code2, color: "#0A7A52" };
  }
  if (name.includes("analysis") || name.includes("design") || color === "#7c6af7") {
    return { Icon: PenTool, color: "#5b47e0" };
  }
  if (name.includes("testing") || color === "#00a878") {
    return { Icon: FlaskConical, color: "#0D5A46" };
  }
  if (name.includes("transversal") || color === "#fb923c") {
    return { Icon: Lightbulb, color: "#B8390A" };
  }
  return { Icon: Layers, color: "#374151" };
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
