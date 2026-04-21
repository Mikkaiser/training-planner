"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { FileUpload } from "@/components/shared/FileUpload";
import { FileIcon } from "@/components/shared/FileIcon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { deleteFile, type UploadResult } from "@/lib/storage/storage";
import type { BlockItem } from "@/lib/plan-detail/types";

type Difficulty = "foundation" | "intermediate" | "advanced";

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  foundation: "badge-difficulty-foundation",
  intermediate: "badge-difficulty-intermediate",
  advanced: "badge-difficulty-advanced",
};

const DIFFICULTY_OPTIONS: Difficulty[] = [
  "foundation",
  "intermediate",
  "advanced",
];

export function ExerciseUploadZone({ block }: { block: BlockItem }) {
  const { planId, colorKey, tokens } = usePlanDetailContext();
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
    mutationFn: async () => {
      if (!main) throw new Error("Upload an exercise file first.");
      if (!title.trim()) throw new Error("Title is required.");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const { error: insertErr } = await supabase.from("exercises").insert({
        topic_id: block.id,
        subcompetence_id: block.subcompetence_id,
        title: title.trim(),
        description: description.trim() || null,
        difficulty,
        file_url: main.path,
        file_name: main.fileName,
        file_type: main.fileType,
        preview_url: preview?.path ?? null,
        preview_file_name: preview?.fileName ?? null,
        created_by: uid,
      });

      if (insertErr) {
        // Best-effort cleanup of the just-uploaded objects so the bucket
        // doesn't accumulate orphans when the metadata insert fails.
        await Promise.allSettled([
          deleteFile("exercises", main.path),
          preview ? deleteFile("exercises", preview.path) : Promise.resolve(),
        ]);
        console.error("[Exercise insert]", insertErr.message);
        throw new Error("Could not save exercise. Please try again.");
      }
    },
    onSuccess: () => {
      toast.success("Exercise uploaded");
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      resetForm();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Could not save exercise.";
      toast.error(msg);
    },
  });

  if (!main) {
    return (
      <FileUpload
        bucket="exercises"
        folder={`blocks/${block.id}`}
        allowed={["pdf", "docx", "zip"]}
        planColor={colorKey}
        label="Upload exercise for this block"
        onUploadComplete={setMain}
      />
    );
  }

  return (
    <form
      className="plan-exercise-upload__form"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="plan-exercise-upload__selected">
        <FileIcon type={main.fileType} size={16} />
        <span className="plan-exercise-upload__filename">{main.fileName}</span>
        <button
          type="button"
          onClick={removeMain}
          className="plan-exercise-upload__cancel-file"
          disabled={mutation.isPending}
          aria-label="Remove uploaded file"
        >
          <X size={14} />
          <span>Change</span>
        </button>
      </div>

      <div>
        <Label htmlFor="ex-title">Title</Label>
        <Input
          id="ex-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="ex-desc">Description</Label>
        <textarea
          id="ex-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="plan-exercise-upload__textarea"
          placeholder="Optional description..."
        />
      </div>

      <div className="plan-exercise-upload__difficulty">
        <span className="plan-exercise-upload__difficulty-label">Difficulty</span>
        <div className="plan-exercise-upload__difficulty-pills">
          {DIFFICULTY_OPTIONS.map((d) => {
            const active = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`plan-exercise-upload__difficulty-pill ${DIFFICULTY_CLASS[d]}`}
                data-active={active ? "true" : undefined}
                data-outlined={active ? undefined : "true"}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="plan-exercise-upload__preview-section">
        <Label>Preview (optional, PDF only)</Label>
        {preview ? (
          <div className="plan-exercise-upload__selected">
            <FileIcon type="pdf" size={16} />
            <span className="plan-exercise-upload__filename">{preview.fileName}</span>
            <button
              type="button"
              onClick={removePreview}
              className="plan-exercise-upload__cancel-file"
              disabled={mutation.isPending}
              aria-label="Remove preview"
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <FileUpload
            bucket="exercises"
            folder={`blocks/${block.id}/previews`}
            allowed={["pdf"]}
            planColor={colorKey}
            label="Add PDF preview"
            onUploadComplete={setPreview}
            disabled={mutation.isPending}
          />
        )}
      </div>

      <div className="plan-exercise-upload__actions">
        <button
          type="button"
          onClick={removeMain}
          className="plan-exercise-upload__cancel"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="plan-exercise-upload__submit"
          style={{
            background: tokens.accent,
            boxShadow: `0 2px 10px ${tokens.glow}`,
          }}
        >
          {mutation.isPending ? "Saving…" : "Save Exercise"}
        </button>
      </div>
    </form>
  );
}
