"use client";

import {
  PLAN_COLORS,
  type PlanColorKey,
  type PlanColorTokens,
} from "@/lib/constants/plan-colors";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import {
  DEFAULT_ALLOWED,
  type AllowedFileType,
  type StorageBucket,
  type UploadResult,
} from "@/lib/storage/storage";
import {
  FileUploadErrorContent,
  FileUploadIdleContent,
  FileUploadSuccessContent,
  FileUploadUploadingContent,
} from "@/components/shared/file-upload-contents";

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
  const tokens: PlanColorTokens = PLAN_COLORS[planColor ?? "iris"];
  const {
    inputRef,
    state,
    isDragging,
    accept,
    hintText,
    onInputChange,
    onDrop,
    openPicker,
    setIsDragging,
    resetToIdle,
  } = useFileUpload({
    bucket,
    folder,
    allowed,
    disabled,
    onUploadComplete,
    onUploadError,
  });

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
        aria-label={label}
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled || state.kind === "uploading"}
      />

      {state.kind === "idle" ? (
        <FileUploadIdleContent
          label={label}
          hint={hintText}
          accentColor={tokens.accent}
        />
      ) : null}

      {state.kind === "uploading" ? (
        <FileUploadUploadingContent
          percent={state.percent}
          name={state.name}
          tokens={tokens}
        />
      ) : null}

      {state.kind === "success" ? (
        <FileUploadSuccessContent name={state.name} />
      ) : null}

      {state.kind === "error" ? (
        <FileUploadErrorContent
          message={state.message}
          accentColor={tokens.accent}
          onRetry={(e) => {
            e.stopPropagation();
            resetToIdle();
          }}
        />
      ) : null}
    </div>
  );
}
