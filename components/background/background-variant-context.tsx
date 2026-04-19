"use client";

import type { ReactNode } from "react";

import { RouteBackgroundBlobs } from "./route-background-blobs";

/**
 * Solid base + animated blobs + app UI. Blobs render before `.app-content-layer`
 * so they paint above the flat base and below the UI (z-1).
 */
export function BackgroundVariantProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="root-background-base" aria-hidden />
      <RouteBackgroundBlobs />
      {children}
    </>
  );
}
