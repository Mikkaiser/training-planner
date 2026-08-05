"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteScheme } from "@/actions/assessments";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { APP_ROUTES } from "@/lib/routes";

export function DeleteSchemeButton({
  schemeId,
  testProject,
  runCount,
}: {
  schemeId: string;
  testProject: string;
  runCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="tp-quiet-host" style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm tp-quiet"
        label="Remove this scheme"
        ariaLabel={`Remove scheme ${testProject}`}
        title={`Remove "${testProject}"?`}
        body={
          runCount > 0
            ? `This deletes the scheme, the archived workbook, and ${runCount} marking run${runCount === 1 ? "" : "s"} with every mark recorded against it. It cannot be undone.`
            : "This deletes the scheme and the archived workbook. It cannot be undone."
        }
        confirmLabel="Remove scheme"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteScheme(schemeId);
            router.push(APP_ROUTES.assessments);
            router.refresh();
          })
        }
      />
    </div>
  );
}
