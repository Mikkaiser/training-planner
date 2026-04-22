"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";

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

const SUCCESS_RESET_MS = 2000;

type UseFileUploadArgs = {
  bucket: StorageBucket;
  folder: string;
  allowed?: AllowedFileType[];
  disabled?: boolean;
  onUploadComplete: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
};

type UseFileUploadReturn = {
  inputRef: React.RefObject<HTMLInputElement>;
  state: UiState;
  isDragging: boolean;
  accept: string;
  hintText: string;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  openPicker: () => void;
  setIsDragging: (value: boolean) => void;
  resetToIdle: () => void;
};

export function useFileUpload({
  bucket,
  folder,
  allowed = DEFAULT_ALLOWED,
  disabled = false,
  onUploadComplete,
  onUploadError,
}: UseFileUploadArgs): UseFileUploadReturn {
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

  const handleFile = async (file: File): Promise<void> => {
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
        onProgress: (pct) => setState({ kind: "uploading", percent: pct, name: file.name }),
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

  const resetToIdle = () => setState({ kind: "idle" });

  return {
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
  };
}

