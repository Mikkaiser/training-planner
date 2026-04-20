import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Code2,
  Layers,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import { GlassCard } from "@/components/shared/glass-card";
import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/planColors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TrainingPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("training_plans")
    .select("id,name,description,status,start_date,color,created_by")
    .eq("id", params.id)
    .maybeSingle();

  if (!plan) {
    return (
      <div className="space-y-[30px]">
        <GlassCard>
          <div className="text-sm text-tp-secondary">
            Plan not found (id: {params.id}).
          </div>
          <div className="mt-3">
            <Link
              href="/dashboard/plans"
              className="text-sm font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
            >
              Back to plans
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const colorKey = resolvePlanColor(
    (plan as unknown as { color?: unknown }).color
  );
  const tokens = PLAN_COLORS[colorKey];

  const { data: tpp } = await supabase
    .from("training_plan_phases")
    .select("phase_id")
    .eq("training_plan_id", params.id);

  const phaseIds = (tpp ?? []).map((r) => (r as { phase_id: string }).phase_id);

  let blockCount = 0;
  let gateCount = 0;
  if (phaseIds.length) {
    const [{ data: topics }, { data: gates }] = await Promise.all([
      supabase.from("topics").select("id").in("phase_id", phaseIds),
      supabase.from("gates").select("id").in("phase_id", phaseIds),
    ]);
    blockCount = topics?.length ?? 0;
    gateCount = gates?.length ?? 0;
  }

  const status = (plan.status ?? "draft").toString();
  const startLabel = plan.start_date
    ? format(parseISO(plan.start_date as string), "dd MMM yyyy")
    : "—";

  return (
    <div className="space-y-[30px]">
      <div
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-[rgba(255,255,255,0.60)] p-[26px] pl-[32px] backdrop-blur-md dark:bg-[rgba(24,22,22,0.55)]"
        style={{
          boxShadow: `0 2px 20px ${tokens.glow}`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[4px]"
          style={{ background: tokens.border }}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-[28px] font-bold text-tp-primary">
                {plan.name?.trim() ? plan.name : "Untitled plan"}
              </h1>
              <span
                className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  background: tokens.chip,
                  borderColor: tokens.chipBorder,
                  color: tokens.chipText,
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            {plan.description?.trim() ? (
              <p className="mt-2 max-w-[72ch] text-sm text-tp-secondary">
                {plan.description}
              </p>
            ) : null}
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-tp-muted">
              <CalendarDays size={14} />
              Start: {startLabel}
            </div>
          </div>

          <Link
            href={`/dashboard/plans/${params.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors"
            style={{
              background: tokens.accent,
              boxShadow: `0 0 14px ${tokens.glow}`,
            }}
          >
            <Pencil size={14} />
            Edit Plan
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <HeaderStat
            icon={<Layers size={18} style={{ color: tokens.accent }} />}
            value={phaseIds.length}
            label="Phases"
          />
          <HeaderStat
            icon={<Code2 size={18} style={{ color: tokens.accent }} />}
            value={blockCount}
            label="Blocks"
          />
          <HeaderStat
            icon={<ShieldCheck size={18} style={{ color: tokens.accent }} />}
            value={gateCount}
            label="Gates"
          />
        </div>
      </div>

      <GlassCard variant="subtle" className="gantt-timeline-wrap">
        <div className="text-sm text-tp-secondary">
          The interactive Gantt view lives in the editor for now. Open{" "}
          <Link
            href={`/dashboard/plans/${params.id}/edit`}
            className="font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
          >
            Edit Plan
          </Link>{" "}
          to reorder phases, add gates, or tweak the timeline.
        </div>
      </GlassCard>
    </div>
  );
}

function HeaderStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-[rgba(255,255,255,0.55)] px-4 py-3 text-center backdrop-blur-sm dark:bg-[rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-center">{icon}</div>
      <div className="mt-1 text-[20px] font-bold text-tp-primary">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-tp-muted">
        {label}
      </div>
    </div>
  );
}
