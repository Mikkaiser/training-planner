"use client";

import { X } from "lucide-react";

import { FileIcon } from "@/components/shared/file-icon";
import type { UploadResult } from "@/lib/storage/storage";

type ExerciseUploadSelectedFileProps = {
  main: UploadResult;
  isPending: boolean;
  onRemoveMain: () => void;
};

export function ExerciseUploadSelectedFile({
  main,
  isPending,
  onRemoveMain,
}: ExerciseUploadSelectedFileProps): React.JSX.Element {
  return (
    <div className="plan-exercise-upload__selected">
      <FileIcon type={main.fileType} size={16} />
      <span className="plan-exercise-upload__filename">{main.fileName}</span>
      <button
        type="button"
        onClick={onRemoveMain}
        className="plan-exercise-upload__cancel-file"
        disabled={isPending}
        aria-label="Remove uploaded file"
      >
        <X size={14} />
        <span>Change</span>
      </button>
    </div>
  );
}

