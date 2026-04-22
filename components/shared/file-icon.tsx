"use client";

import { File, FileArchive, FileText, type LucideProps } from "lucide-react";

import type { AllowedFileType } from "@/lib/storage/storage";

const ICON_MAP: Record<
  AllowedFileType,
  { Icon: React.ComponentType<LucideProps>; color: string }
> = {
  pdf: { Icon: FileText, color: "var(--color-negative)" },
  docx: { Icon: File, color: "var(--color-accent)" },
  zip: { Icon: FileArchive, color: "var(--plan-accent, var(--color-accent))" },
};

export interface FileIconProps extends Omit<LucideProps, "color" | "type"> {
  type: AllowedFileType | string | null | undefined;
  size?: number;
}

export function FileIcon({ type, size = 16, style, ...rest }: FileIconProps) {
  const key = normalize(type);
  const resolved = key ? ICON_MAP[key] : null;
  const Icon = resolved?.Icon ?? File;
  const color = resolved?.color ?? "var(--color-text-muted)";

  return (
    <Icon
      size={size}
      aria-hidden
      style={{ color, ...style }}
      {...rest}
    />
  );
}

function normalize(type: FileIconProps["type"]): AllowedFileType | null {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower === "pdf" || lower.includes("pdf")) return "pdf";
  if (lower === "docx" || lower.includes("wordprocessingml")) return "docx";
  if (lower === "zip" || lower.includes("zip")) return "zip";
  return null;
}
