/**
 * The trainingplanner mark, and the lockup.
 *
 * Drawn inline rather than loaded as a file, which is how every other graphic
 * in this codebase works — there is no next/image and no <img> anywhere. Inline
 * also means the mark takes its colours from CSS variables, so the light and
 * dark variants are one component rather than two files that can fall out of
 * step.
 *
 * The wordmark is real text, not the SVG's <text> element. The supplied lockup
 * sets it in Space Grotesk, and an SVG carrying a font-family renders in
 * whatever the browser substitutes when that font is missing — silently, and
 * wrong. As text it uses the font the app actually loads.
 */
export function Logo({
  variant = "lockup",
  tone = "light",
  size = 26,
}: {
  variant?: "lockup" | "mark";
  /** "dark" is for a dark background: white squares, brighter accent. */
  tone?: "light" | "dark";
  /** Height of the mark in px; the wordmark scales with the surrounding type. */
  size?: number;
}) {
  const squares = tone === "dark" ? "#ffffff" : "var(--brand-ink)";
  const dot = tone === "dark" ? "var(--brand-accent-on-dark)" : "var(--brand-accent)";

  return (
    <span className="tp-brand">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, display: "block" }}
      >
        <rect x="4" y="4" width="19" height="19" rx="6" fill={squares} />
        <rect x="25" y="4" width="19" height="19" rx="6" fill={squares} />
        <rect x="4" y="25" width="19" height="19" rx="6" fill={squares} />
        <circle cx="34.5" cy="34.5" r="9.5" fill={dot} />
      </svg>

      {variant === "lockup" ? (
        <span className="tp-brand-word" style={{ color: tone === "dark" ? "#ffffff" : "var(--brand-ink)" }}>
          trainingplanner
        </span>
      ) : null}
    </span>
  );
}
