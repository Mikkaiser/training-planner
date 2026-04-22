"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ExerciseUploadMetadataFieldsProps = {
  title: string;
  onTitleChange: (next: string) => void;
  description: string;
  onDescriptionChange: (next: string) => void;
};

export function ExerciseUploadMetadataFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
}: ExerciseUploadMetadataFieldsProps): React.JSX.Element {
  return (
    <>
      <div>
        <Label htmlFor="ex-title">Title</Label>
        <Input
          id="ex-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="ex-desc">Description</Label>
        <textarea
          id="ex-desc"
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="plan-exercise-upload__textarea"
          placeholder="Optional description..."
        />
      </div>
    </>
  );
}

