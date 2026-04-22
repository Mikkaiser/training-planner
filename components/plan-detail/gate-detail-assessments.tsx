"use client";

import { ClipboardList } from "lucide-react";

import { DownloadButton } from "@/components/shared/download-button";
import { FileIcon } from "@/components/shared/file-icon";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { AllowedFileType } from "@/lib/storage/storage";
import type { GateAssessment } from "@/lib/plan-detail/types";

type GateDetailAssessmentsProps = {
  assessments: GateAssessment[];
  accentColor: string;
  planColor: PlanColorKey;
};

export function GateDetailAssessments({
  assessments,
  accentColor,
  planColor,
}: GateDetailAssessmentsProps): React.JSX.Element | null {
  if (assessments.length === 0) return null;

  return (
    <section className="plan-gate-detail__section">
      <h3>
        <ClipboardList size={16} style={{ color: accentColor }} />
        <span>Assessment Documents</span>
      </h3>
      <ul className="plan-gate-detail__assessments">
        {assessments.map((a) => (
          <li key={a.id} className="plan-gate-detail__assessment">
            <FileIcon type={a.file_type} size={16} />
            <span className="plan-gate-detail__assessment-title">{a.title}</span>
            {a.file_url && a.file_name ? (
              <DownloadButton
                bucket="gate-assessments"
                filePath={a.file_url}
                fileName={a.file_name}
                // DB value is expected to be a known `AllowedFileType` (validated on upload).
                fileType={(a.file_type as AllowedFileType) || "pdf"}
                variant="button"
                planColor={planColor}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

