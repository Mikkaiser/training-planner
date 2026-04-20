"use client";

import {
  BLOB_VARIANT_SPECS,
  type BlobSpec,
  type BlobVariant,
} from "@/lib/background-blob-variant";
import { useEffect, useState } from "react";

function animationClassName(spec: BlobSpec): string {
  switch (spec.animation) {
    case "blobFloat1":
      return "tp-blob-float-1";
    case "blobFloat2":
      return "tp-blob-float-2";
    case "blobFloat3":
      return "tp-blob-float-3";
    default:
      return "tp-blob-float-1";
  }
}

export function BackgroundBlobs({ variant }: { variant: BlobVariant }) {
  const specs = BLOB_VARIANT_SPECS[variant];
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.getAttribute("data-theme") === "dark");
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="background-blobs pointer-events-none fixed inset-0 z-0 overflow-visible"
      aria-hidden
    >
      {specs.map((spec, i) => (
        <div
          key={`${variant}-${i}`}
          className={`background-blobs__blob tp-blob-core fixed left-0 top-0 z-0 rounded-full will-change-transform ${animationClassName(spec)}`}
          style={{
            width: `${spec.size}px`,
            height: `${spec.size}px`,
            left: spec.left,
            top: spec.top,
            transform: "translate(-50%, -50%)",
            backgroundColor: isDark ? spec.colorDark : spec.colorLight,
            filter: `blur(${spec.blur}px)`,
            animationDuration: `${spec.durationSec}s`,
            animationDirection: spec.reverse ? "reverse" : "normal",
          }}
        />
      ))}
    </div>
  );
}
