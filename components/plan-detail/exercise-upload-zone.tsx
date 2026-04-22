"use client";

import { useState } from "react";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { ExerciseUploadActions } from "@/components/plan-detail/exercise-upload-actions";
import { ExerciseUploadDifficultyPills, type Difficulty } from "@/components/plan-detail/exercise-upload-difficulty-pills";
import { ExerciseUploadMetadataFields } from "@/components/plan-detail/exercise-upload-metadata-fields";
import { ExerciseUploadPicker } from "@/components/plan-detail/exercise-upload-picker";
import { ExerciseUploadPreviewSection } from "@/components/plan-detail/exercise-upload-preview-section";
import { ExerciseUploadSelectedFile } from "@/components/plan-detail/exercise-upload-selected-file";
import { useSaveExercise } from "@/lib/hooks/use-save-exercise";
import { deleteFile, type UploadResult } from "@/lib/storage/storage";
import type { BlockItem } from "@/lib/plan-detail/types";

export function ExerciseUploadZone({ block }: { block: BlockItem }) {
  const { planId, colorKey, tokens } = usePlanDetailContext();

  const [main, setMain] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<UploadResult | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("foundation");

  const resetForm = () => {
    setMain(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setDifficulty("foundation");
  };

  const removePreview = async () => {
    if (!preview) return;
    const path = preview.path;
    setPreview(null);
    try {
      await deleteFile("exercises", path);
    } catch (err) {
      if (err instanceof Error) {
        console.error("[Storage error] remove preview", err.message);
      }
    }
  };

  const removeMain = async () => {
    if (!main) return;
    const path = main.path;
    // Reset everything back to the upload picker.
    resetForm();
    try {
      await deleteFile("exercises", path);
    } catch (err) {
      if (err instanceof Error) {
        console.error("[Storage error] remove main", err.message);
      }
    }
  };

  const saveMutation = useSaveExercise({
    planId,
    onSuccess: resetForm,
  });

  if (!main) {
    return (
      <ExerciseUploadPicker
        blockId={block.id}
        planColor={colorKey}
        onUploadComplete={setMain}
      />
    );
  }

  return (
    <form
      className="plan-exercise-upload__form"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate({
          block,
          main,
          preview,
          title,
          description,
          difficulty,
        });
      }}
    >
      <ExerciseUploadSelectedFile
        main={main}
        isPending={saveMutation.isPending}
        onRemoveMain={() => void removeMain()}
      />

      <ExerciseUploadMetadataFields
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
      />

      <ExerciseUploadDifficultyPills
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
      />

      <ExerciseUploadPreviewSection
        blockId={block.id}
        planColor={colorKey}
        preview={preview}
        isPending={saveMutation.isPending}
        onUploadComplete={setPreview}
        onRemovePreview={() => void removePreview()}
      />

      <ExerciseUploadActions
        isPending={saveMutation.isPending}
        onCancel={() => void removeMain()}
        submitStyle={{
          background: tokens.accent,
          boxShadow: `0 2px 10px ${tokens.glow}`,
        }}
      />
    </form>
  );
}
