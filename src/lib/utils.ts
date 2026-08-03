import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Plan derivations (progress, current block, gate status) deliberately do NOT
// live here — they are in @/lib/plan-view-model so that all five views read the
// same numbers. A second copy in this file was how the list card and the detail
// header ended up disagreeing.

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const UNITS = ["b", "kb", "mb", "gb"] as const;

/** "420 kb", "1.2 mb" — lowercase units, matching the design's file chips. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 b";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${UNITS[exponent]}`;
}
