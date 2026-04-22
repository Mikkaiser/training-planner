export type BlobVariant =
  | "login"
  | "dashboard"
  | "gantt"
  | "management"
  | "gates";

export type BlobFloatAnimation = "blobFloat1" | "blobFloat2" | "blobFloat3";

export type BlobSpec = {
  size: number;
  /** rgba() string for light mode */
  colorLight: string;
  /** rgba() string for dark mode */
  colorDark: string;
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
      colorLight: "rgba(105,0,255,0.08)",
      colorDark: "rgba(105,0,255,0.12)",
      left: "40%",
      top: "-15%",
      blur: 100,
      animation: "blobFloat1",
      durationSec: 16,
    },
    {
      size: 500,
      colorLight: "rgba(82,255,186,0.10)",
      colorDark: "rgba(82,255,186,0.06)",
      left: "75%",
      top: "60%",
      blur: 90,
      animation: "blobFloat2",
      durationSec: 20,
    },
    {
      size: 350,
      colorLight: "rgba(105,0,255,0.05)",
      colorDark: "rgba(105,0,255,0.07)",
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
      colorLight: "rgba(105,0,255,0.07)",
      colorDark: "rgba(37,99,235,0.14)",
      left: "-10%",
      top: "-15%",
      blur: 90,
      animation: "blobFloat1",
      durationSec: 20,
    },
    {
      size: 500,
      colorLight: "rgba(82,255,186,0.10)",
      colorDark: "rgba(82,255,186,0.06)",
      left: "75%",
      top: "65%",
      blur: 85,
      animation: "blobFloat2",
      durationSec: 24,
    },
    {
      size: 400,
      colorLight: "rgba(179,215,255,0.40)",
      colorDark: "rgba(37,99,235,0.08)",
      left: "35%",
      top: "30%",
      blur: 70,
      animation: "blobFloat3",
      durationSec: 28,
    },
    {
      size: 300,
      colorLight: "rgba(105,0,255,0.05)",
      colorDark: "rgba(37,99,235,0.10)",
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
      colorLight: "rgba(105,0,255,0.09)",
      colorDark: "rgba(37,99,235,0.16)",
      left: "-15%",
      top: "-20%",
      blur: 90,
      animation: "blobFloat1",
      durationSec: 20,
    },
    {
      size: 500,
      colorLight: "rgba(82,255,186,0.08)",
      colorDark: "rgba(82,255,186,0.05)",
      left: "80%",
      top: "75%",
      blur: 85,
      animation: "blobFloat2",
      durationSec: 24,
    },
    {
      size: 280,
      colorLight: "rgba(105,0,255,0.06)",
      colorDark: "rgba(37,99,235,0.10)",
      left: "85%",
      top: "-5%",
      blur: 70,
      animation: "blobFloat3",
      durationSec: 28,
    },
    {
      size: 250,
      colorLight: "rgba(82,255,186,0.05)",
      colorDark: "rgba(82,255,186,0.03)",
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
      colorLight: "rgba(105,0,255,0.07)",
      colorDark: "rgba(37,99,235,0.14)",
      left: "-10%",
      top: "-15%",
      blur: 100,
      animation: "blobFloat1",
      durationSec: 24,
    },
    {
      size: 400,
      colorLight: "rgba(82,255,186,0.05)",
      colorDark: "rgba(82,255,186,0.03)",
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
      colorLight: "rgba(105,0,255,0.08)",
      colorDark: "rgba(37,99,235,0.14)",
      left: "-5%",
      top: "-10%",
      blur: 85,
      animation: "blobFloat1",
      durationSec: 18,
    },
    {
      size: 400,
      colorLight: "rgba(255,96,96,0.10)",
      colorDark: "rgba(255,96,96,0.10)",
      left: "70%",
      top: "65%",
      blur: 90,
      animation: "blobFloat2",
      durationSec: 22,
    },
    {
      size: 350,
      colorLight: "rgba(105,0,255,0.06)",
      colorDark: "rgba(37,99,235,0.10)",
      left: "80%",
      top: "5%",
      blur: 75,
      animation: "blobFloat3",
      durationSec: 26,
    },
    {
      size: 300,
      colorLight: "rgba(255,96,96,0.08)",
      colorDark: "rgba(255,96,96,0.08)",
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
 * Dashboard subtree blob variant (see USAGE MAP).
 */
export function resolveDashboardBlobVariant(pathname: string): BlobVariant {
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/plans" || path.startsWith("/plans/")) {
    return "management";
  }

  if (path === "/dashboard") return "dashboard";

  const planMatch = /^\/plans\/([^/]+)$/.exec(path);
  if (planMatch) {
    const segment = planMatch[1];
    if (segment !== "new") return "gantt";
  }

  if (path === "/dashboard/gates" || path.startsWith("/dashboard/gates/")) {
    return "gates";
  }

  if (
    path.startsWith("/plans") ||
    path.startsWith("/phases") ||
    path.startsWith("/dashboard/subcompetences") ||
    path.startsWith("/dashboard/exercises") ||
    path.startsWith("/dashboard/users")
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
    path.startsWith("/dashboard") ||
    path === "/plans" ||
    path.startsWith("/plans/")
  ) {
    return resolveDashboardBlobVariant(pathname);
  }

  return "management";
}
