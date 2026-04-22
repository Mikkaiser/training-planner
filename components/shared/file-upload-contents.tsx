"use client";

import { AlertCircle, CheckCircle, Loader2, UploadCloud } from "lucide-react";

import type { PlanColorTokens } from "@/lib/constants/plan-colors";

const DEFAULT_TRUNCATE_MAX = 30;

function truncateName(name: string, max = DEFAULT_TRUNCATE_MAX): string {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const head = name.slice(0, max - ext.length - 1);
  return `${head}…${ext}`;
}

type IdleContentProps = {
  label: string;
  hint: string;
  accentColor: string;
};

export function FileUploadIdleContent({
  label,
  hint,
  accentColor,
}: IdleContentProps): React.JSX.Element {
  return (
    <>
      <UploadCloud size={32} style={{ color: accentColor, opacity: 0.55 }} aria-hidden />
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary, inherit)" }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{hint}</span>
    </>
  );
}

type UploadingContentProps = {
  percent: number;
  name: string;
  tokens: PlanColorTokens;
};

export function FileUploadUploadingContent({
  percent,
  name,
  tokens,
}: UploadingContentProps): React.JSX.Element {
  return (
    <>
      <Loader2 size={32} style={{ color: tokens.accent }} className="animate-spin" aria-hidden />
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: `color-mix(in srgb, ${tokens.accent} 12%, transparent)`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: tokens.accent,
              transition: "width 120ms ease",
            }}
          />
        </div>
      </div>
      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        Uploading {truncateName(name)}… {percent}%
      </span>
    </>
  );
}

type SuccessContentProps = {
  name: string;
};

export function FileUploadSuccessContent({ name }: SuccessContentProps): React.JSX.Element {
  return (
    <>
      <CheckCircle size={32} style={{ color: "var(--color-positive)" }} aria-hidden />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{truncateName(name)}</span>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Upload complete</span>
    </>
  );
}

type ErrorContentProps = {
  message: string;
  accentColor: string;
  onRetry: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function FileUploadErrorContent({
  message,
  accentColor,
  onRetry,
}: ErrorContentProps): React.JSX.Element {
  return (
    <>
      <AlertCircle size={32} style={{ color: "var(--color-negative)" }} aria-hidden />
      <span
        style={{
          fontSize: 13,
          color: "var(--color-negative)",
          maxWidth: 320,
        }}
      >
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          fontSize: 12,
          color: accentColor,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Try again
      </button>
    </>
  );
}

