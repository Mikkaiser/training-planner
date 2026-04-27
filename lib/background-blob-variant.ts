export type BlobVariant =
  | "login"
  | "dashboard"
  | "gantt"
  | "management"
  | "gates";

export type BlobFloatAnimation = "blobFloat1" | "blobFloat2" | "blobFloat3";

export type BlobSpec = {
  size: number;
  /** rgba() string for the light-only blob color. */
  color: string;
  /** Position of blob center */
  left: string;
  top: string;
  blur: number;
  animation: BlobFloatAnimation;
  durationSec: number;
  reverse?: boolean;
};

export const BLOB_VARIANT_SPECS: Record<BlobVariant, BlobSpec[]> = {
  login: [
    {
      size: 700,
      color: "rgba(52,201,154,0.12)",
      left: "40%",
      top: "-15%",
      blur: 100,
      animation: "blobFloat1",
      durationSec: 16,
    },
    {
      size: 500,
      color: "rgba(168,240,218,0.16)",
      left: "75%",
      top: "60%",
      blur: 90,
      animation: "blobFloat2",
      durationSec: 20,
    },
    {
      size: 350,
      color: "rgba(52,201,154,0.09)",
      left: "-5%",
      top: "70%",
      blur: 80,
      animation: "blobFloat3",
      durationSec: 24,
    },
  ],
  dashboard: [
    {
      size: 650,
      color: "rgba(168,240,218,0.12)",
      left: "-10%",
      top: "-15%",
      blur: 90,
      animation: "blobFloat1",
      durationSec: 20,
    },
    {
      size: 500,
      color: "rgba(52,201,154,0.12)",
      left: "75%",
      top: "65%",
      blur: 85,
      animation: "blobFloat2",
      durationSec: 24,
    },
    {
      size: 400,
      color: "rgba(168,240,218,0.16)",
      left: "35%",
      top: "30%",
      blur: 70,
      animation: "blobFloat3",
      durationSec: 28,
    },
    {
      size: 300,
      color: "rgba(52,201,154,0.09)",
      left: "80%",
      top: "5%",
      blur: 80,
      animation: "blobFloat1",
      durationSec: 22,
      reverse: true,
    },
  ],
  gantt: [
    {
      size: 550,
      color: "rgba(168,240,218,0.12)",
      left: "-15%",
      top: "-20%",
      blur: 90,
      animation: "blobFloat1",
      durationSec: 20,
    },
    {
      size: 500,
      color: "rgba(52,201,154,0.12)",
      left: "80%",
      top: "75%",
      blur: 85,
      animation: "blobFloat2",
      durationSec: 24,
    },
    {
      size: 280,
      color: "rgba(168,240,218,0.16)",
      left: "85%",
      top: "-5%",
      blur: 70,
      animation: "blobFloat3",
      durationSec: 28,
    },
    {
      size: 250,
      color: "rgba(52,201,154,0.09)",
      left: "-8%",
      top: "80%",
      blur: 70,
      animation: "blobFloat1",
      durationSec: 22,
      reverse: true,
    },
  ],
  management: [
    {
      size: 500,
      color: "rgba(168,240,218,0.12)",
      left: "-10%",
      top: "-15%",
      blur: 100,
      animation: "blobFloat1",
      durationSec: 24,
    },
    {
      size: 400,
      color: "rgba(52,201,154,0.12)",
      left: "75%",
      top: "70%",
      blur: 100,
      animation: "blobFloat2",
      durationSec: 28,
    },
  ],
  gates: [
    {
      size: 550,
      color: "rgba(168,240,218,0.16)",
      left: "-5%",
      top: "-10%",
      blur: 85,
      animation: "blobFloat1",
      durationSec: 18,
    },
    {
      size: 400,
      color: "rgba(52,201,154,0.09)",
      left: "70%",
      top: "65%",
      blur: 90,
      animation: "blobFloat2",
      durationSec: 22,
    },
    {
      size: 350,
      color: "rgba(168,240,218,0.12)",
      left: "80%",
      top: "5%",
      blur: 75,
      animation: "blobFloat3",
      durationSec: 26,
    },
    {
      size: 300,
      color: "rgba(52,201,154,0.12)",
      left: "10%",
      top: "75%",
      blur: 80,
      animation: "blobFloat1",
      durationSec: 20,
      reverse: true,
    },
  ],
};

/**
 * Authenticated app subtree blob variant (see USAGE MAP).
 */
export function resolveShellBlobVariant(pathname: string): BlobVariant {
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/plans" || path.startsWith("/plans/")) {
    return "management";
  }

  if (path === "/exercises" || path.startsWith("/exercises/")) {
    return "management";
  }

  const planMatch = /^\/plans\/([^/]+)$/.exec(path);
  if (planMatch) {
    const segment = planMatch[1];
    if (segment !== "new") return "gantt";
  }

  if (path === "/gates" || path.startsWith("/gates/")) {
    return "gates";
  }

  if (
    path.startsWith("/plans") ||
    path.startsWith("/phases") ||
    path.startsWith("/subcompetences") ||
    path.startsWith("/competitors") ||
    path.startsWith("/users")
  ) {
    return "management";
  }

  return "management";
}

/**
 * Resolves blob variant from the current pathname. Used by `RouteBackgroundBlobs`
 * in the root shell so blobs sit above `root-background-base` and below
 * `.app-content-layer` (z-index 1).
 */
export function resolveAppBlobVariant(pathname: string): BlobVariant {
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/login") return "login";

  if (
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  ) {
    return "management";
  }

  if (
    path.startsWith("/plans") ||
    path.startsWith("/exercises") ||
    path.startsWith("/competitors")
  ) {
    return resolveShellBlobVariant(pathname);
  }

  return "management";
}
