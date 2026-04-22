"use client";

import { FileUpload } from "@/components/shared/file-upload";
import type { PlanColorKey } from "@/lib/constants/plan-colors";

type ExerciseUploadPickerProps = {
  blockId: string;
  planColor: PlanColorKey;
  onUploadComplete: (result: import("@/lib/storage/storage").UploadResult) => void;
};

export function ExerciseUploadPicker({
  blockId,
  planColor,
  onUploadComplete,
}: ExerciseUploadPickerProps): React.JSX.Element {
  return (
    <FileUpload
      bucket="exercises"
      folder={`blocks/${blockId}`}
      allowed={["pdf", "docx", "zip"]}
      planColor={planColor}
      label="Upload exercise for this block"
      onUploadComplete={onUploadComplete}
    />
  );
}

