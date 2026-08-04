import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { DeleteRunButton } from "@/components/assessment/DeleteRunButton";
import { MarkingSheet } from "@/components/assessment/MarkingSheet";
import { getRunById } from "@/lib/assessment-data";
import { getInstructorName } from "@/lib/plan-data";
import { assessmentSchemeRoute } from "@/lib/routes";
import { BackArrowIcon } from "@/components/ui/icons";

export default async function RunPage({ params }: { params: { id: string } }) {
  const [{ run, scheme, marks }, instructorName] = await Promise.all([
    getRunById(params.id),
    getInstructorName(),
  ]);

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />

      <section className="tp-shell tp-page-section">
        <Link
          href={assessmentSchemeRoute(scheme.id)}
          className="tp-btn tp-btn-ghost tp-btn-sm"
          style={{ marginBottom: 16 }}
        >
          <BackArrowIcon size={12} /> {scheme.test_project}
        </Link>

        <div className="tp-page-head">
          <div className="tp-col" style={{ gap: 6, minWidth: 0 }}>
            <div className="tp-eyebrow">Marking run</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
              {run.student_name ?? "Practice run"}
            </h1>
            <div className="tp-mut tp-sm">
              {run.plan_title ?? "Not linked to a plan"}
              {run.label ? ` · ${run.label}` : ""}
            </div>
          </div>
        </div>

        <MarkingSheet scheme={scheme} runId={run.id} initialMarks={marks} />

        <DeleteRunButton runId={run.id} schemeId={scheme.id} who={run.student_name ?? "this practice run"} />
      </section>
    </main>
  );
}
