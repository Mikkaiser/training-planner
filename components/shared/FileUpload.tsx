"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AlertCircle, CheckCircle, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  PLAN_COLORS,
  type PlanColorKey,
  type PlanColorTokens,
} from "@/lib/constants/planColors";
import {
  buildAcceptAttribute,
  describeAllowed,
  uploadFile,
  validateFile,
  DEFAULT_ALLOWED,
  type AllowedFileType,
  type StorageBucket,
  type UploadResult,
} from "@/lib/storage/storage";

type UiState =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number; name: string }
  | { kind: "success"; name: string }
  | { kind: "error"; message: string };

export interface FileUploadProps {
  bucket: StorageBucket;
  folder: string;
  allowed?: AllowedFileType[];
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  label?: string;
  disabled?: boolean;
  planColor?: PlanColorKey;
}

const SUCCESS_RESET_MS = 2000;

function truncateName(name: string, max = 30) {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const head = name.slice(0, max - ext.length - 1);
  return `${head}…${ext}`;
}

export function FileUpload({
  bucket,
  folder,
  allowed = DEFAULT_ALLOWED,
  onUploadComplete,
  onUploadError,
  label = "Upload file",
  disabled = false,
  planColor,
}: FileUploadProps) {
  const tokens: PlanColorTokens = PLAN_COLORS[planColor ?? "blue"];
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (state.kind !== "success") return;
    const t = window.setTimeout(() => setState({ kind: "idle" }), SUCCESS_RESET_MS);
    return () => window.clearTimeout(t);
  }, [state]);

  const accept = buildAcceptAttribute(allowed);
  const hintText = `${describeAllowed(allowed)}, max 20MB`;

  const handleFile = async (file: File) => {
    const invalid = validateFile(file, allowed);
    if (invalid) {
      setState({ kind: "error", message: invalid.message });
      onUploadError?.(invalid.message);
      return;
    }

    setState({ kind: "uploading", percent: 0, name: file.name });
    try {
      const result = await uploadFile(bucket, file, folder, {
        allowed,
        onProgress: (pct) =>
          setState({ kind: "uploading", percent: pct, name: file.name }),
      });
      setState({ kind: "success", name: file.name });
      onUploadComplete(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setState({ kind: "error", message });
      onUploadError?.(message);
      toast.error(message);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || state.kind === "uploading") return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const openPicker = () => {
    if (disabled || state.kind === "uploading") return;
    inputRef.current?.click();
  };

  const baseStyle: React.CSSProperties = {
    borderRadius: 12,
    padding: 24,
    border: isDragging
      ? `2px solid ${tokens.accent}`
      : `2px dashed ${tokens.chipBorder}`,
    background: isDragging
      ? `color-mix(in srgb, ${tokens.accent} 6%, transparent)`
      : "var(--color-surface)",
    transform: isDragging ? "scale(1.01)" : "scale(1)",
    transition: "background 120ms ease, border-color 120ms ease, transform 120ms ease",
    cursor: disabled || state.kind === "uploading" ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 120,
    textAlign: "center",
    userSelect: "none",
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || state.kind === "uploading"}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && state.kind !== "uploading") setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      style={baseStyle}
      data-state={state.kind}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled || state.kind === "uploading"}
      />

      {state.kind === "idle" ? (
        <IdleContent
          label={label}
          hint={hintText}
          accentColor={tokens.accent}
        />
      ) : null}

      {state.kind === "uploading" ? (
        <UploadingContent
          percent={state.percent}
          name={state.name}
          tokens={tokens}
        />
      ) : null}

      {state.kind === "success" ? (
        <SuccessContent name={state.name} />
      ) : null}

      {state.kind === "error" ? (
        <ErrorContent
          message={state.message}
          accentColor={tokens.accent}
          onRetry={(e) => {
            e.stopPropagation();
            setState({ kind: "idle" });
          }}
        />
      ) : null}
    </div>
  );
}

function IdleContent({
  label,
  hint,
  accentColor,
}: {
  label: string;
  hint: string;
  accentColor: string;
}) {
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

function UploadingContent({
  percent,
  name,
  tokens,
}: {
  percent: number;
  name: string;
  tokens: PlanColorTokens;
}) {
  return (
    <>
      <Loader2
        size={32}
        style={{ color: tokens.accent }}
        className="animate-spin"
        aria-hidden
      />
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

function SuccessContent({ name }: { name: string }) {
  return (
    <>
      <CheckCircle
        size={32}
        style={{ color: "var(--color-positive)" }}
        aria-hidden
      />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{truncateName(name)}</span>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        Upload complete
      </span>
    </>
  );
}

function ErrorContent({
  message,
  accentColor,
  onRetry,
}: {
  message: string;
  accentColor: string;
  onRetry: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <>
      <AlertCircle
        size={32}
        style={{ color: "var(--color-negative)" }}
        aria-hidden
      />
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
