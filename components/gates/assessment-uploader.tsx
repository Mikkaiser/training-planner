"use client";

import { useState } from "react";

import { AssessmentUploaderForm } from "@/components/gates/assessment-uploader-form";
import { deleteFile, type UploadResult } from "@/lib/storage/storage";
import { useUploadGateAssessment } from "@/lib/hooks/use-upload-gate-assessment";

type AssessmentUploaderProps = {
  gateId: string;
  queryKey: readonly ["dashboard-gates"];
};

export function AssessmentUploader({
  gateId,
  queryKey,
}: AssessmentUploaderProps): React.JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setUploaded(null);
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  const removeUploaded = async () => {
    if (!uploaded) return;
    const path = uploaded.path;
    setUploaded(null);
    try {
      await deleteFile("gate-assessments", path);
    } catch (err) {
      if (err instanceof Error) {
        console.error("[Storage error] remove assessment", err.message);
      }
    }
  };

  const mutation = useUploadGateAssessment(queryKey);

  return (
    <AssessmentUploaderForm
      gateId={gateId}
      isPending={mutation.isPending}
      showForm={showForm}
      uploaded={uploaded}
      title={title}
      description={description}
      onShowForm={() => setShowForm(true)}
      onUploadComplete={setUploaded}
      onRemoveUploaded={() => void removeUploaded()}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
      onCancel={reset}
      onSubmit={() => {
        if (!uploaded) return;
        mutation.mutate({ gateId, uploaded, title, description }, { onSuccess: reset });
      }}
    />
  );
}

