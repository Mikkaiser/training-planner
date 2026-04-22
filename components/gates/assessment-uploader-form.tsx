"use client";

import { FileText, Plus, X } from "lucide-react";

import type { UploadResult } from "@/lib/storage/storage";
import { FileIcon } from "@/components/shared/file-icon";
import { FileUpload } from "@/components/shared/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AssessmentUploaderFormProps = {
  gateId: string;
  isPending: boolean;
  showForm: boolean;
  uploaded: UploadResult | null;
  title: string;
  description: string;
  onShowForm: () => void;
  onUploadComplete: (value: UploadResult) => void;
  onRemoveUploaded: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function AssessmentUploaderForm({
  gateId,
  isPending,
  showForm,
  uploaded,
  title,
  description,
  onShowForm,
  onUploadComplete,
  onRemoveUploaded,
  onTitleChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: AssessmentUploaderFormProps): React.JSX.Element {
  if (!showForm) {
    return (
      <button
        type="button"
        onClick={onShowForm}
        className="hover-tint inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-accent-muted)] px-3 py-1.5 text-sm font-medium text-tp-primary transition"
      >
        <Plus size={14} />
        <span>Add assessment</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      {!uploaded ? (
        <FileUpload
          bucket="gate-assessments"
          folder={`gates/${gateId}`}
          label="Upload gate assessment document"
          onUploadComplete={onUploadComplete}
          disabled={isPending}
        />
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <FileIcon type={uploaded.fileType} size={16} />
          <span className="flex-1 truncate text-sm text-tp-primary">
            {uploaded.fileName}
          </span>
          <button
            type="button"
            onClick={onRemoveUploaded}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-tp-muted hover:text-tp-primary"
            disabled={isPending}
            aria-label="Remove uploaded file"
          >
            <X size={12} />
            <span>Remove</span>
          </button>
        </div>
      )}

      <div>
        <Label htmlFor={`ga-title-${gateId}`}>Title</Label>
        <Input
          id={`ga-title-${gateId}`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          placeholder="e.g. Foundation Gate rubric"
        />
      </div>

      <div>
        <Label htmlFor={`ga-desc-${gateId}`}>Description</Label>
        <textarea
          id={`ga-desc-${gateId}`}
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="glass-input w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
          placeholder="Optional notes for instructors..."
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-tp-secondary transition hover:text-tp-primary"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !uploaded || !title.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText size={14} />
          <span>{isPending ? "Saving…" : "Save assessment"}</span>
        </button>
      </div>
    </form>
  );
}

