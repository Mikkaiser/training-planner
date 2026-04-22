"use client";

type ExerciseUploadActionsProps = {
  isPending: boolean;
  onCancel: () => void;
  submitStyle: React.CSSProperties;
};

export function ExerciseUploadActions({
  isPending,
  onCancel,
  submitStyle,
}: ExerciseUploadActionsProps): React.JSX.Element {
  return (
    <div className="plan-exercise-upload__actions">
      <button
        type="button"
        onClick={onCancel}
        className="plan-exercise-upload__cancel"
        disabled={isPending}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="plan-exercise-upload__submit"
        style={submitStyle}
      >
        {isPending ? "Saving…" : "Save Exercise"}
      </button>
    </div>
  );
}

