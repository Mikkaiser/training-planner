"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRun } from "@/actions/assessments";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { assessmentSchemeRoute } from "@/lib/routes";

export function DeleteRunButton({ runId, schemeId, who }: { runId: string; schemeId: string; who: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="tp-quiet-host" style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm tp-quiet"
        label="Remove this run"
        ariaLabel="Remove this marking run"
        title="Remove this marking run?"
        body={`Every mark and comment recorded for ${who} on this run is deleted. The scheme itself is untouched.`}
        confirmLabel="Remove run"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteRun(runId);
            router.push(assessmentSchemeRoute(schemeId));
            router.refresh();
          })
        }
      />
    </div>
  );
}
