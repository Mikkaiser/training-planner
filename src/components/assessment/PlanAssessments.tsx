import Link from "next/link";
import { MarkTestProjectButton, type SchemeOption } from "@/components/assessment/MarkTestProjectButton";
import { assessmentRunRoute } from "@/lib/routes";
import type { PlanAssessment } from "@/lib/assessment-data";

/**
 * A competitor's marking runs, shown on their roadmap.
 *
 * Sits outside the view switch so it appears on the timeline, tree and route
 * alike — assessment results are a property of the competitor, not of the shape
 * you happen to be looking at the roadmap in.
 */
export function PlanAssessments({
  planId,
  assessments,
  schemes,
}: {
  planId: string;
  assessments: PlanAssessment[];
  schemes: SchemeOption[];
}) {
  return (
    <section style={{ maxWidth: 720, margin: "40px auto 0" }}>
      <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <div className="tp-eyebrow">Assessments</div>
        <MarkTestProjectButton planId={planId} schemes={schemes} />
      </div>

      {assessments.length === 0 ? (
        <div
          className="tp-tiny tp-mut"
          style={{
            padding: "14px 16px",
            background: "var(--surface-2)",
            borderRadius: 12,
            border: "1px dashed var(--border-strong)",
          }}
        >
          No test projects marked yet. Marking a scheme against this competitor will show the score here.
        </div>
      ) : (
        <div className="tp-col tp-gap-2">
          {assessments.map((assessment) => (
            <Link
              key={assessment.runId}
              href={assessmentRunRoute(assessment.runId)}
              className="tp-card"
              style={{ padding: "14px 16px", display: "block" }}
            >
              <div className="tp-row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {assessment.testProject}
                  </div>
                  <div className="tp-tiny tp-mut">
                    {assessment.label ? `${assessment.label} · ` : ""}
                    {assessment.markedCount}/{assessment.aspectCount} aspects marked
                  </div>
                </div>

                <div className="tp-row tp-gap-3" style={{ alignItems: "baseline", flexShrink: 0 }}>
                  <span className="tp-mono" style={{ fontSize: 15, fontWeight: 700 }}>
                    {assessment.awarded}
                    <span className="tp-mut" style={{ fontSize: 12, fontWeight: 600 }}>
                      {" "}
                      / {assessment.maxMark}
                    </span>
                  </span>
                  {/* "In progress" until every aspect has an answer: a partial
                      total is not a score, and reading it as one would flatter
                      or damn the competitor on incomplete marking. */}
                  <span className={`tp-status ${assessment.isComplete ? "tp-status-passed" : "tp-status-pending"}`}>
                    {assessment.isComplete ? `${assessment.percentage}%` : "In progress"}
                  </span>
                </div>
              </div>

              <div className="tp-row tp-gap-3 tp-mt-3">
                <div className="tp-bar" style={{ flex: 1 }}>
                  <i style={{ width: `${assessment.percentage}%` }} />
                </div>
                <span className="tp-tiny tp-mono tp-mut">{assessment.percentage}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
