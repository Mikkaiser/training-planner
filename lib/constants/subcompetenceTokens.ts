/**
 * Subcompetence color tokens — resolve raw subcompetence hex colors (as stored
 * in the DB) into theme-aware bg/border/fg tuples used by the
 * `.subcompetence-chip` CSS class via `--subcompetence-bg|border|fg`.
 *
 * Light mode rules out raw color values that fail WCAG contrast on light
 * surfaces (notably the lime #DBFD6B). Dark mode can use near-full saturation
 * text since contrast is reversed.
 *
 * Only allowed place (along with globals.css and planColors.ts) to hardcode
 * palette values — see `.cursor/rules/design-system.mdc`.
 */

export type SubcompetenceTokens = {
  bg: string;
  border: string;
  fg: string;
  /** Raw color value (CSS custom property source). Used only to seed the
   *  chip color-mix() fallback when a specific override isn't available. */
  color: string;
};

type Preset = {
  light: Omit<SubcompetenceTokens, "color">;
  dark: Omit<SubcompetenceTokens, "color">;
};

const PRESETS: Record<string, Preset> = {
  // Analysis & Design — violet
  "#7c6af7": {
    light: {
      bg: "rgba(124,106,247,0.12)",
      border: "rgba(124,106,247,0.40)",
      fg: "#5b47e0",
    },
    dark: {
      bg: "rgba(124,106,247,0.12)",
      border: "rgba(124,106,247,0.30)",
      fg: "#a78bfa",
    },
  },
  // Development — new green (#22c55e) + legacy lime (#DBFD6B) mapped to olive in light
  "#22c55e": {
    light: {
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.40)",
      fg: "#166534",
    },
    dark: {
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.30)",
      fg: "#4ade80",
    },
  },
  "#dbfd6b": {
    // Dev legacy: bright lime is invisible on light surfaces, use dark olive.
    light: {
      bg: "rgba(150,180,0,0.12)",
      border: "rgba(150,180,0,0.40)",
      fg: "#5a6e00",
    },
    dark: {
      bg: "rgba(219,253,107,0.10)",
      border: "rgba(219,253,107,0.28)",
      fg: "#dbfd6b",
    },
  },
  // Testing — teal
  "#00a878": {
    light: {
      bg: "rgba(0,168,120,0.12)",
      border: "rgba(0,168,120,0.40)",
      fg: "#007a58",
    },
    dark: {
      bg: "rgba(0,168,120,0.10)",
      border: "rgba(0,168,120,0.28)",
      fg: "#00a878",
    },
  },
  // Transversal — orange
  "#fb923c": {
    light: {
      bg: "rgba(251,146,60,0.12)",
      border: "rgba(251,146,60,0.40)",
      fg: "#c45e00",
    },
    dark: {
      bg: "rgba(251,146,60,0.10)",
      border: "rgba(251,146,60,0.28)",
      fg: "#fb923c",
    },
  },
};

function isHex(v: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(v);
}

/**
 * Resolve a (possibly user-defined) subcompetence color into a theme-aware
 * tokens object. Falls back to color-mix-based tokens via the passed-in color.
 *
 * @param rawColor The raw color string stored on the subcompetence row.
 * @param isDark   Whether dark mode is currently active.
 */
export function getSubcompetenceTokens(
  rawColor: string | null | undefined,
  isDark: boolean,
): SubcompetenceTokens {
  const color = (rawColor ?? "").trim();
  const key = color.toLowerCase();
  const preset = PRESETS[key];

  if (preset) {
    const v = isDark ? preset.dark : preset.light;
    return { ...v, color };
  }

  // Fallback — let the `.subcompetence-chip` CSS fall back to color-mix()
  // based on the raw color. We still return a sensible `fg` so inline
  // usages stay accessible in light mode.
  const fallbackFg = color && isHex(color) ? color : "var(--color-accent)";
  return {
    bg: "",
    border: "",
    fg: fallbackFg,
    color: color || "var(--color-accent)",
  };
}

/**
 * Build inline style props that feed `.subcompetence-chip` in globals.css.
 *
 * The CSS class uses `--subcompetence-bg|border|fg|color` custom properties
 * with sensible color-mix() fallbacks when only `--subcompetence-color` is set.
 */
export function subcompetenceChipStyle(
  rawColor: string | null | undefined,
  isDark: boolean,
): React.CSSProperties {
  const tokens = getSubcompetenceTokens(rawColor, isDark);
  const style: Record<string, string> = {
    "--subcompetence-color": tokens.color,
  };
  if (tokens.bg) style["--subcompetence-bg"] = tokens.bg;
  if (tokens.border) style["--subcompetence-border"] = tokens.border;
  if (tokens.fg) style["--subcompetence-fg"] = tokens.fg;
  return style as React.CSSProperties;
}
