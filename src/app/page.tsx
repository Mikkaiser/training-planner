import { cookies } from "next/headers";
import { TopBar } from "@/components/layout/TopBar";
import { ListFilters } from "@/components/plan/list/ListFilters";
import { NewPlanButton } from "@/components/plan/list/NewPlanButton";
import { PlanCardsView } from "@/components/plan/list/PlanCardsView";
import { PlanTableView } from "@/components/plan/list/PlanTableView";
import { ViewSwitcher } from "@/components/plan/ViewSwitcher";
import { getInstructorName, getInstructorStats, getPlansForCurrentInstructor } from "@/lib/plan-data";
import { buildPlanSummary, type PlanSummaryVM } from "@/lib/plan-view-model";
import { LIST_VIEWS, LIST_VIEW_COOKIE, LIST_VIEW_LABELS, parseListView, VIEW_PARAM } from "@/lib/view-modes";

// Next 14: searchParams is a plain object here. It becomes a Promise in 15.
interface PlanListPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function matchesFilters(plan: PlanSummaryVM, q: string, phase: string, gate: string): boolean {
  if (q) {
    const haystack = `${plan.studentName} ${plan.title}`.toLowerCase();
    if (!haystack.includes(q.toLowerCase())) return false;
  }
  if (phase && plan.currentPhaseName !== phase) return false;
  if (gate && plan.gateStatus !== gate) return false;
  return true;
}

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function PlanListPage({ searchParams }: PlanListPageProps) {
  const view = parseListView(searchParams[VIEW_PARAM], cookies().get(LIST_VIEW_COOKIE)?.value);

  const [plans, instructorName, stats] = await Promise.all([
    getPlansForCurrentInstructor(),
    getInstructorName(),
    getInstructorStats(),
  ]);

  const summaries = plans.map(buildPlanSummary);

  const q = first(searchParams.q);
  const phase = first(searchParams.phase);
  const gate = first(searchParams.gate);
  const visible = summaries.filter((plan) => matchesFilters(plan, q, phase, gate));

  // Counted from the unfiltered set: the headline describes the roster, not
  // the current search.
  const draftCount = summaries.filter((plan) => plan.isDraft).length;
  const activeCount = summaries.length - draftCount;

  const phaseOptions = Array.from(
    new Set(summaries.map((plan) => plan.currentPhaseName).filter((name): name is string => Boolean(name))),
  ).sort();

  const isTable = view === "table";

  return (
    <main className="tp-page">
      <TopBar instructorName={instructorName} mode="list" />

      <section className="tp-shell tp-page-section">
        <div className="tp-page-head">
          <div className="tp-col" style={{ gap: isTable ? 4 : 6 }}>
            {!isTable ? <div className="tp-eyebrow">WorldSkills · SD</div> : null}
            <h1 style={{ fontSize: isTable ? 28 : 34, fontWeight: 700, letterSpacing: "-0.025em", margin: 0 }}>
              Training Plans
            </h1>
            <div className="tp-mut tp-sm">
              {activeCount} active {activeCount === 1 ? "competitor" : "competitors"}
              {draftCount > 0 ? ` · ${draftCount} draft${draftCount === 1 ? "" : "s"}` : ""}
            </div>
          </div>

          <div className="tp-head-actions">
            {isTable ? <ListFilters phases={phaseOptions} /> : null}
            <ViewSwitcher
              label="Plan list view"
              current={view}
              cookieName={LIST_VIEW_COOKIE}
              options={LIST_VIEWS.map((value) => ({ value, label: LIST_VIEW_LABELS[value] }))}
            />
            {/* Only plans with something worth copying are offered. */}
            <NewPlanButton templates={summaries.filter((plan) => !plan.isDraft)} />
          </div>
        </div>

        {isTable ? <PlanTableView plans={visible} stats={stats} /> : <PlanCardsView plans={visible} />}
      </section>
    </main>
  );
}
