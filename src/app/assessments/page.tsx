import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { SchemeUpload } from "@/components/assessment/SchemeUpload";
import { getSchemesForCurrentInstructor } from "@/lib/assessment-data";
import { getInstructorName } from "@/lib/plan-data";
import { assessmentSchemeRoute } from "@/lib/routes";

export default async function AssessmentsPage() {
  const [schemes, instructorName] = await Promise.all([
    getSchemesForCurrentInstructor(),
    getInstructorName(),
  ]);

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />

      <section className="tp-shell tp-page-section">
        <div className="tp-page-head">
          <div className="tp-col" style={{ gap: 6 }}>
            <div className="tp-eyebrow">Assessment guide</div>
            <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>Marking schemes</h1>
            <div className="tp-mut tp-sm">
              {schemes.length === 0
                ? "Upload a test project's marking scheme to start marking against it."
                : `${schemes.length} test project${schemes.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 560, marginBottom: 28 }}>
          <SchemeUpload />
        </div>

        {schemes.length === 0 ? null : (
          <div className="tp-card-grid">
            {schemes.map((scheme) => (
              <Link key={scheme.id} href={assessmentSchemeRoute(scheme.id)} className="tp-card" style={{ padding: 22 }}>
                <div className="tp-col" style={{ gap: 4 }}>
                  <div className="tp-eyebrow">{scheme.skill}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                    {scheme.test_project}
                  </div>
                </div>

                <div className="tp-row tp-gap-2 tp-mt-4" style={{ flexWrap: "wrap" }}>
                  <span className="tp-pill">{scheme.total_max} marks</span>
                  <span className="tp-tiny tp-mut">
                    {scheme.criterion_count} criteria · {scheme.aspect_count} aspects
                  </span>
                </div>

                <div
                  className="tp-mt-4 tp-row"
                  style={{
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--surface-2)",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
                    <div className="tp-eyebrow">Marking runs</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {scheme.run_count === 0 ? "None yet" : `${scheme.run_count} recorded`}
                    </div>
                  </div>
                </div>

                <div className="tp-mt-3 tp-tiny tp-mut" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {scheme.source_file_name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
