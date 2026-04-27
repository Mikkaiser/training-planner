/**
 * Subcompetence color tokens — resolve raw subcompetence hex colors (as stored
 * in the DB) into bg/border/fg tuples used by the
 * `.subcompetence-chip` CSS class via `--subcompetence-bg|border|fg`.
 *
 * Bright legacy colors that fail WCAG contrast on light surfaces are mapped to
 * the current light-only design system.
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

const PRESETS: Record<string, Omit<SubcompetenceTokens, "color">> = {
  // Analysis & Design — violet
  "#7c6af7": {
    bg: "rgba(124,106,247,0.12)",
    border: "rgba(124,106,247,0.35)",
    fg: "#5b47e0",
  },
  // Development — system mint, with legacy green/lime mapped to the same token.
  "#1dbf8a": {
    bg: "rgba(29,191,138,0.12)",
    border: "rgba(29,191,138,0.35)",
    fg: "#0A7A52",
  },
  "#22c55e": {
    bg: "rgba(29,191,138,0.12)",
    border: "rgba(29,191,138,0.35)",
    fg: "#0A7A52",
  },
  "#dbfd6b": {
    bg: "rgba(29,191,138,0.12)",
    border: "rgba(29,191,138,0.35)",
    fg: "#0A7A52",
  },
  // Testing — teal
  "#00a878": {
    bg: "rgba(13,90,70,0.10)",
    border: "rgba(13,90,70,0.28)",
    fg: "#0D5A46",
  },
  // Transversal — coral
  "#fb923c": {
    bg: "rgba(255,123,84,0.12)",
    border: "rgba(255,123,84,0.35)",
    fg: "#B8390A",
  },
};

function isHex(v: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(v);
}

/**
 * Resolve a (possibly user-defined) subcompetence color into a light-mode
 * tokens object. Falls back to color-mix-based tokens via the passed-in color.
 *
 * @param rawColor The raw color string stored on the subcompetence row.
 */
export function getSubcompetenceTokens(
  rawColor: string | null | undefined,
): SubcompetenceTokens {
  const color = (rawColor ?? "").trim();
  const key = color.toLowerCase();
  const preset = PRESETS[key];

  if (preset) {
    return { ...preset, color };
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
): React.CSSProperties {
  const tokens = getSubcompetenceTokens(rawColor);
  const style: Record<string, string> = {
    "--subcompetence-color": tokens.color,
  };
  if (tokens.bg) style["--subcompetence-bg"] = tokens.bg;
  if (tokens.border) style["--subcompetence-border"] = tokens.border;
  if (tokens.fg) style["--subcompetence-fg"] = tokens.fg;
  // The returned object is a bag of CSS custom properties consumed by globals.css.
  return style as React.CSSProperties;
}
