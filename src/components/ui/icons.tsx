/**
 * The design's own icon set, transcribed from the Claude Design project's
 * data.jsx. These are not lucide equivalents — the gate glyph in particular
 * (a turnstile: two posts and two rails) has no lucide counterpart, and the
 * others are drawn on smaller viewBoxes with lighter strokes than lucide's
 * defaults, which is what keeps them from overpowering 11px labels.
 */

type IconProps = { size?: number; className?: string };

export function PlusIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2v8M2 6h8" />
    </svg>
  );
}

export function ChevronIcon({ size = 10, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 2L6.5 5l-3 3" />
    </svg>
  );
}

export function BackArrowIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 3L5 7l4 4" />
    </svg>
  );
}

export function GateIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 4v8M13.5 4v8M2.5 6.5h11M2.5 9.5h11" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 7.5L5.5 10.5 11.5 4" />
    </svg>
  );
}

export function CrossIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  );
}

export function UploadIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 8V2M3.5 4.5L6 2l2.5 2.5M2 9.5h8" />
    </svg>
  );
}

/**
 * Arrow into a tray. The design reused its upload glyph for the action on an
 * attached file, which points the wrong way: from the instructor's side that
 * row is something to take, not something to send.
 */
export function DownloadIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10.5h8" />
    </svg>
  );
}

export function PencilIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8.25 1.75l2 2-6 6-2.5.5.5-2.5 6-6zM7 3l2 2" />
    </svg>
  );
}

export function TrashIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 3.25h8M4.75 3.25V2.25h2.5v1M3.25 3.25l.5 6.5h4.5l.5-6.5M5 5.25v2.75M7 5.25v2.75" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.5 6.75v3a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 .75-.75h3M7.25 2h3v3M5 7l5-5" />
    </svg>
  );
}

export function SearchIcon({ size = 12, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="3.5" />
      <path d="M9.5 9.5L8 8" strokeLinecap="round" />
    </svg>
  );
}
