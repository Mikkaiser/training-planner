"use client";

import { X } from "lucide-react";

import { FileUpload } from "@/components/shared/file-upload";
import { FileIcon } from "@/components/shared/file-icon";
import { Label } from "@/components/ui/label";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { UploadResult } from "@/lib/storage/storage";

type ExerciseUploadPreviewSectionProps = {
  blockId: string;
  planColor: PlanColorKey;
  preview: UploadResult | null;
  isPending: boolean;
  onUploadComplete: (result: UploadResult) => void;
  onRemovePreview: () => void;
};

export function ExerciseUploadPreviewSection({
  blockId,
  planColor,
  preview,
  isPending,
  onUploadComplete,
  onRemovePreview,
}: ExerciseUploadPreviewSectionProps): React.JSX.Element {
  return (
    <div className="plan-exercise-upload__preview-section">
      <Label>Preview (optional, PDF only)</Label>
      {preview ? (
        <div className="plan-exercise-upload__selected">
          <FileIcon type="pdf" size={16} />
          <span className="plan-exercise-upload__filename">{preview.fileName}</span>
          <button
            type="button"
            onClick={onRemovePreview}
            className="plan-exercise-upload__cancel-file"
            disabled={isPending}
            aria-label="Remove preview"
          >
            <X size={14} />
            <span>Remove</span>
          </button>
        </div>
      ) : (
        <FileUpload
          bucket="exercises"
          folder={`blocks/${blockId}/previews`}
          allowed={["pdf"]}
          planColor={planColor}
          label="Add PDF preview"
          onUploadComplete={onUploadComplete}
          disabled={isPending}
        />
      )}
    </div>
  );
}

