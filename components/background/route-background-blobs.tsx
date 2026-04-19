"use client";

import { usePathname } from "next/navigation";

import { resolveAppBlobVariant } from "@/lib/background-blob-variant";

import { BackgroundBlobs } from "./background-blobs";

/**
 * Single blob layer for the whole app, mounted in the root shell between the
 * solid base and `.app-content-layer` so fixed z-0 blobs are not obscured.
 */
export function RouteBackgroundBlobs() {
  const pathname = usePathname();
  const variant = resolveAppBlobVariant(pathname);

  return <BackgroundBlobs variant={variant} />;
}
