"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  PLAN_COLORS,
  type PlanColorKey,
} from "@/lib/constants/planColors";
import {
  getSignedUrl,
  type AllowedFileType,
  type StorageBucket,
} from "@/lib/storage/storage";

export interface DownloadButtonProps {
  bucket: StorageBucket;
  filePath: string;
  fileName: string;
  fileType: AllowedFileType;
  variant?: "button" | "link";
  planColor?: PlanColorKey;
  label?: string;
  className?: string;
}

export function DownloadButton({
  bucket,
  filePath,
  fileName,
  variant = "button",
  planColor,
  label,
  className,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const tokens = PLAN_COLORS[planColor ?? "blue"];

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const url = await getSignedUrl(bucket, filePath);
      triggerDownload(url, fileName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Icon = loading ? Loader2 : Download;

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          color: tokens.accent,
          cursor: loading ? "progress" : "pointer",
          padding: 0,
          font: "inherit",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        <Icon
          size={14}
          className={loading ? "animate-spin" : undefined}
          aria-hidden
        />
        <span>{label ?? fileName}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: tokens.chip,
        border: `1px solid ${tokens.chipBorder}`,
        color: tokens.chipText,
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "progress" : "pointer",
        transition: "background 120ms ease, transform 120ms ease",
      }}
    >
      <Icon
        size={14}
        className={loading ? "animate-spin" : undefined}
        aria-hidden
      />
      <span>{label ?? "Download"}</span>
    </button>
  );
}

function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
