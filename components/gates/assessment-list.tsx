"use client";

import type { AllowedFileType } from "@/lib/storage/storage";
import { DownloadButton } from "@/components/shared/download-button";
import { FileIcon } from "@/components/shared/file-icon";
import type { Assessment } from "@/components/gates/gates-types";

type AssessmentListProps = {
  assessments: Assessment[];
};

export function AssessmentList({ assessments }: AssessmentListProps): React.JSX.Element {
  if (assessments.length === 0) {
    return <p className="text-sm text-tp-muted">No assessment documents yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {assessments.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2"
        >
          <FileIcon type={a.file_type} size={16} />
          <div className="flex-1">
            <div className="text-sm font-medium text-tp-primary">{a.title}</div>
            {a.description ? (
              <div className="text-xs text-tp-muted">{a.description}</div>
            ) : null}
          </div>
          {a.file_url && a.file_name ? (
            <DownloadButton
              bucket="gate-assessments"
              filePath={a.file_url}
              fileName={a.file_name}
              // DB value is expected to be a known `AllowedFileType` (validated on upload).
              fileType={(a.file_type as AllowedFileType) || "pdf"}
              variant="button"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

