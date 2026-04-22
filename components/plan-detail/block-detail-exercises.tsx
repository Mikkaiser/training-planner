"use client";

import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

import { DownloadButton } from "@/components/shared/download-button";
import { FileIcon } from "@/components/shared/file-icon";
import { ExerciseUploadZone } from "@/components/plan-detail/exercise-upload-zone";
import type { AllowedFileType } from "@/lib/storage/storage";
import type { BlockItem, Exercise } from "@/lib/plan-detail/types";
import type { PlanColorKey } from "@/lib/constants/plan-colors";

const DIFFICULTY_CLASS: Record<string, string> = {
  foundation: "badge-difficulty-foundation",
  intermediate: "badge-difficulty-intermediate",
  advanced: "badge-difficulty-advanced",
};

function parseAllowedFileType(value: string | null | undefined): AllowedFileType | null {
  if (value === "pdf" || value === "docx" || value === "zip") return value;
  return null;
}

type BlockDetailExercisesProps = {
  block: BlockItem;
  exercises: Exercise[];
  accentColor: string;
  planColor: PlanColorKey;
};

export function BlockDetailExercises({
  block,
  exercises,
  accentColor,
  planColor,
}: BlockDetailExercisesProps): React.JSX.Element {
  return (
    <section className="plan-block-detail__section">
      <h3>
        <BookOpen size={16} style={{ color: accentColor }} />
        <span>Exercises</span>
      </h3>
      <div className="plan-block-detail__exercises">
        {exercises.length === 0 ? (
          <div className="plan-block-detail__exercises-empty">No exercises yet for this block.</div>
        ) : (
          exercises.map((ex) => {
            const diffKey = ex.difficulty ?? "foundation";
            const diffClass = DIFFICULTY_CLASS[diffKey] ?? DIFFICULTY_CLASS.foundation;
            const fileType = parseAllowedFileType(ex.file_type);
            return (
              <motion.article
                key={ex.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="plan-block-detail__exercise-card"
              >
                <FileIcon type={ex.file_type} size={20} />
                <div className="plan-block-detail__exercise-body">
                  <div className="plan-block-detail__exercise-title-row">
                    <span className="plan-block-detail__exercise-title">{ex.title}</span>
                    {ex.difficulty ? (
                      <span className={`plan-block-detail__exercise-diff ${diffClass}`}>
                        {ex.difficulty}
                      </span>
                    ) : null}
                  </div>
                  {ex.description ? (
                    <p className="plan-block-detail__exercise-desc">{ex.description}</p>
                  ) : null}
                  {ex.preview_url && ex.preview_file_name ? (
                    <div className="plan-block-detail__exercise-preview">
                      <DownloadButton
                        bucket="exercises"
                        filePath={ex.preview_url}
                        fileName={ex.preview_file_name}
                        fileType="pdf"
                        variant="link"
                        planColor={planColor}
                        label="Preview"
                      />
                    </div>
                  ) : null}
                </div>
                {ex.file_url && ex.file_name ? (
                  <DownloadButton
                    bucket="exercises"
                    filePath={ex.file_url}
                    fileName={ex.file_name}
                    fileType={fileType || "pdf"}
                    variant="button"
                    planColor={planColor}
                  />
                ) : null}
              </motion.article>
            );
          })
        )}
        <ExerciseUploadZone block={block} />
      </div>
    </section>
  );
}

