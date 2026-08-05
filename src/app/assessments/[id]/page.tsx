import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { DeleteSchemeButton } from "@/components/assessment/DeleteSchemeButton";
import { RunActions } from "@/components/assessment/RunActions";
import { StartRunButton } from "@/components/assessment/StartRunButton";
import { getRunsForScheme, getSchemeById } from "@/lib/assessment-data";
import { getInstructorName, getPlansForCurrentInstructor } from "@/lib/plan-data";
import { assessmentRunRoute, APP_ROUTES } from "@/lib/routes";
import { BackArrowIcon } from "@/components/ui/icons";

export default async function SchemePage({ params }: { params: { id: string } }) {
  const [scheme, runs, plans, instructorName] = await Promise.all([
    getSchemeById(params.id),
    getRunsForScheme(params.id),
    getPlansForCurrentInstructor(),
    getInstructorName(),
  ]);

  const aspects = scheme.criteria.flatMap((criterion) =>
    criterion.subCriteria.flatMap((sub) => sub.aspects),
  );
  const judgementCount = aspects.filter((aspect) => aspect.type === "judgement").length;

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />

      <section className="tp-shell tp-page-section">
        <Link href={APP_ROUTES.assessments} className="tp-btn tp-btn-ghost tp-btn-sm" style={{ marginBottom: 16 }}>
          <BackArrowIcon size={12} /> All schemes
        </Link>

        <div className="tp-page-head">
          <div className="tp-col" style={{ gap: 6, minWidth: 0 }}>
            <div className="tp-eyebrow">{scheme.skill}</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.25 }}>
              {scheme.test_project}
            </h1>
            <div className="tp-mut tp-sm">
              {scheme.criteria.length} criteria · {aspects.length} aspects ({judgementCount} judgement) ·{" "}
              {scheme.total_max} marks
            </div>
          </div>
          <div className="tp-head-actions">
            <StartRunButton
              schemeId={scheme.id}
              competitors={plans.map((plan) => ({
                id: plan.id,
                studentName: plan.student_name,
                title: plan.title,
              }))}
            />
          </div>
        </div>

        {runs.length > 0 ? (
          <div className="tp-card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <div className="tp-eyebrow">Marking runs</div>
            </div>
            {runs.map((run) => (
              <div
                key={run.id}
                className="tp-row tp-row-linked tp-card-linked"
                style={{
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 18px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
                  <Link
                    href={assessmentRunRoute(run.id)}
                    className="tp-card-link"
                    style={{ fontSize: 14, fontWeight: 600 }}
                  >
                    {run.student_name ?? "Practice run"}
                    {run.label ? <span className="tp-mut"> · {run.label}</span> : null}
                  </Link>
                  <div className="tp-tiny tp-mut">{run.plan_title ?? "Not linked to a plan"}</div>
                </div>
                <div className="tp-row tp-gap-3" style={{ flexShrink: 0, alignItems: "center" }}>
                  <span className="tp-tiny tp-mono tp-mut">
                    {run.marked_count}/{aspects.length} marked
                  </span>
                  <RunActions
                    run={{
                      id: run.id,
                      label: run.label,
                      planId: run.plan_id,
                      who: run.student_name ?? "this practice run",
                      markedCount: run.marked_count,
                    }}
                    competitors={plans.map((plan) => ({
                      id: plan.id,
                      name: `${plan.student_name} · ${plan.title}`,
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* The scheme itself, read-only. It mirrors the workbook so you can
            check the import against the file it came from. */}
        <div className="tp-col tp-gap-4">
          {scheme.criteria.map((criterion) => (
            <div key={criterion.id} className="tp-card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                className="tp-row"
                style={{ justifyContent: "space-between", gap: 12, padding: "16px 18px", flexWrap: "wrap" }}
              >
                <div className="tp-row tp-gap-3" style={{ minWidth: 0 }}>
                  <span className="tp-mono tp-tiny tp-mut" style={{ width: 20 }}>
                    {criterion.letter}
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{criterion.name}</div>
                </div>
                <div className="tp-row tp-gap-2" style={{ flexWrap: "wrap" }}>
                  {criterion.max_measurement ? <span className="tp-tag tp-tag-dev">M {criterion.max_measurement}</span> : null}
                  {criterion.max_judgement ? <span className="tp-tag tp-tag-anal">J {criterion.max_judgement}</span> : null}
                  <span className="tp-pill tp-pill-mono">{criterion.max_total ?? 0}</span>
                </div>
              </div>

              {criterion.subCriteria.map((sub) => (
                <div key={sub.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="tp-row tp-gap-3" style={{ padding: "10px 18px", background: "var(--surface-2)" }}>
                    <span className="tp-mono tp-tiny tp-mut">{sub.code}</span>
                    <span className="tp-sm" style={{ fontWeight: 600 }}>
                      {sub.name}
                    </span>
                  </div>
                  {sub.aspects.map((aspect) => (
                    <div key={aspect.id} className="tp-row" style={{ gap: 12, padding: "10px 18px", alignItems: "flex-start" }}>
                      <span
                        className="tp-tag"
                        style={{
                          flexShrink: 0,
                          background: aspect.type === "judgement" ? "var(--blue-soft)" : "var(--accent-soft)",
                          color: aspect.type === "judgement" ? "var(--blue)" : "var(--ink)",
                        }}
                      >
                        {aspect.type === "judgement" ? "J" : "M"}
                      </span>
                      <div className="tp-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                        <div className="tp-sm">{aspect.description}</div>
                        {aspect.extra_description ? (
                          <div className="tp-tiny tp-mut">{aspect.extra_description}</div>
                        ) : null}
                      </div>
                      <span className="tp-tiny tp-mono tp-mut" style={{ flexShrink: 0 }}>
                        {aspect.max_mark}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <DeleteSchemeButton schemeId={scheme.id} testProject={scheme.test_project} runCount={runs.length} />
      </section>
    </main>
  );
}
