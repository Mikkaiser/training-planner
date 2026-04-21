"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Code2,
  Eye,
  Layers,
  Map as MapIcon,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/planColors";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PlanListSkeleton } from "@/components/shared/skeletons";
import { cn } from "@/lib/utils";

/**
 * One training plan row enriched with aggregated counts and creator info.
 * We fetch this client-side so delete/refresh works without full-page reloads.
 */
export type PlanListItem = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  start_date: string | null;
  created_at: string | null;
  color: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  phase_count: number;
  block_count: number;
  gate_count: number;
};

async function fetchPlans(): Promise<PlanListItem[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!authData.user) return [];

  const userId = authData.user.id;

  // Base plans for this user.
  const { data: plans, error } = await supabase
    .from("training_plans")
    .select(
      "id,name,description,status,start_date,created_at,color,created_by"
    )
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!plans?.length) return [];

  const planIds = (plans as Array<{ id: string }>).map((p) => p.id);

  // Gather all training_plan_phases rows for these plans in one query.
  const { data: tpp, error: tppErr } = await supabase
    .from("training_plan_phases")
    .select("training_plan_id,phase_id")
    .in("training_plan_id", planIds);
  if (tppErr) throw tppErr;

  const phaseIdsByPlan = new Map<string, Set<string>>();
  const allPhaseIds = new Set<string>();
  for (const row of tpp ?? []) {
    const planId = (row as { training_plan_id: string }).training_plan_id;
    const phaseId = (row as { phase_id: string }).phase_id;
    if (!phaseIdsByPlan.has(planId)) phaseIdsByPlan.set(planId, new Set());
    phaseIdsByPlan.get(planId)!.add(phaseId);
    allPhaseIds.add(phaseId);
  }

  // Fetch block + gate counts per phase via two lookup queries.
  const phaseIdArr = Array.from(allPhaseIds);
  const blocksByPhase = new Map<string, number>();
  const gatesByPhase = new Map<string, number>();

  if (phaseIdArr.length) {
    const { data: topics, error: topicsErr } = await supabase
      .from("topics")
      .select("phase_id")
      .in("phase_id", phaseIdArr);
    if (topicsErr) throw topicsErr;
    for (const t of topics ?? []) {
      const pid = (t as { phase_id: string }).phase_id;
      blocksByPhase.set(pid, (blocksByPhase.get(pid) ?? 0) + 1);
    }

    const { data: gates, error: gatesErr } = await supabase
      .from("gates")
      .select("phase_id")
      .in("phase_id", phaseIdArr);
    if (gatesErr) throw gatesErr;
    for (const g of gates ?? []) {
      const pid = (g as { phase_id: string }).phase_id;
      gatesByPhase.set(pid, (gatesByPhase.get(pid) ?? 0) + 1);
    }
  }

  // Creator profile (single row for this user).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();

  type PlanRow = {
    id: string;
    name: string | null;
    description: string | null;
    status: string | null;
    start_date: string | null;
    created_at: string | null;
    color: string | null;
  };

  return (plans as PlanRow[]).map((p) => {
    const phases = phaseIdsByPlan.get(p.id) ?? new Set<string>();
    let blockCount = 0;
    let gateCount = 0;
    for (const pid of phases) {
      blockCount += blocksByPhase.get(pid) ?? 0;
      gateCount += gatesByPhase.get(pid) ?? 0;
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      start_date: p.start_date,
      created_at: p.created_at,
      color: p.color,
      creator_name:
        ((profile as { full_name?: string | null } | null)?.full_name ?? null) as
          | string
          | null,
      creator_avatar:
        ((profile as { avatar_url?: string | null } | null)?.avatar_url ?? null) as
          | string
          | null,
      phase_count: phases.size,
      block_count: blockCount,
      gate_count: gateCount,
    };
  });
}

export function useTrainingPlans() {
  return useQuery({
    queryKey: ["training-plans"],
    queryFn: fetchPlans,
  });
}

async function deletePlan(planId: string) {
  const supabase = getSupabaseBrowserClient();
  // training_plan_phases cascades from training_plans.id, so the junction
  // rows clean themselves up. We still need `.select()` here so Supabase
  // returns the affected rows — without it, RLS-blocked deletes look like
  // success (no error + 0 rows), which is exactly the "delete didn't stick"
  // bug. Admin role is required by the `del_admin` policy on training_plans.
  const { data, error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Plan not deleted. Only the instructor who created the plan or an admin can delete it."
    );
  }
}

export function PlansList() {
  const { data, isLoading, isError, error } = useTrainingPlans();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: async (_void, planId) => {
      queryClient.setQueryData<PlanListItem[] | undefined>(
        ["training-plans"],
        (cur) => (cur ? cur.filter((p) => p.id !== planId) : cur)
      );
      toast.success("Plan deleted");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to delete plan.";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return <PlanListSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load plans: {error instanceof Error ? error.message : "Unknown error."}
      </div>
    );
  }

  const plans = data ?? [];

  if (!plans.length) {
    return <PlansEmptyState />;
  }

  return (
    <div className="plan-grid">
      <AnimatePresence initial={false}>
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
          >
            <PlanCard
              plan={plan}
              onDelete={() => removeMutation.mutate(plan.id)}
              deleting={removeMutation.isPending && removeMutation.variables === plan.id}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PlansEmptyState() {
  return (
    <div className="glass-panel glass-panel--subtle flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
      <MapIcon className="h-12 w-12 text-[var(--color-accent)] opacity-40" />
      <div className="mt-4 text-lg font-semibold text-tp-primary">
        No training plans yet
      </div>
      <div className="mt-1 text-sm text-tp-muted">
        Create your first plan to start building your roadmap
      </div>
      <Link
        href="/dashboard/plans/new"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-cta hover:bg-[var(--color-accent-hover,var(--color-accent))]"
      >
        <Plus className="h-4 w-4" />
        New Training Plan
      </Link>
    </div>
  );
}

function initialsFrom(name: string | null | undefined): string {
  const src = (name ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

function PlanCard({
  plan,
  onDelete,
  deleting,
}: {
  plan: PlanListItem;
  onDelete: () => void;
  deleting: boolean;
}) {
  const colorKey = resolvePlanColor(plan.color);
  const tokens = PLAN_COLORS[colorKey];

  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const status = (plan.status ?? "draft").toString();

  const startLabel = useMemo(() => {
    if (!plan.start_date) return "—";
    try {
      return format(parseISO(plan.start_date), "dd MMM yyyy");
    } catch {
      return "—";
    }
  }, [plan.start_date]);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const cardStyle: React.CSSProperties = {
    borderLeftColor: tokens.border,
    ["--plan-card-glow" as string]: tokens.glow,
  };

  return (
    <div className="plan-card" style={cardStyle}>
      <div className="plan-card-header">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Link
            href={`/dashboard/plans/${plan.id}`}
            className="min-w-0 truncate text-[16px] font-bold text-tp-primary hover:underline"
          >
            {plan.name?.trim() ? plan.name : "Untitled plan"}
          </Link>
          <StatusBadge status={status} planColor={colorKey} />
        </div>
        {plan.description?.trim() ? (
          <div className="plan-card-description">{plan.description}</div>
        ) : null}
      </div>

      <div className="plan-card-stats">
        <StatItem
          icon={<Layers size={18} />}
          value={plan.phase_count}
          label="Phases"
          colorKey={colorKey}
        />
        <StatDivider />
        <StatItem
          icon={<Code2 size={18} />}
          value={plan.block_count}
          label="Blocks"
          colorKey={colorKey}
        />
        <StatDivider />
        <StatItem
          icon={<ShieldCheck size={18} />}
          value={plan.gate_count}
          label="Gates"
          colorKey={colorKey}
        />
      </div>

      <div className="plan-card-meta">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-tp-muted">
          <CalendarDays size={14} />
          Start: {startLabel}
        </span>
        <span className="inline-flex items-center gap-2 text-[12px] text-tp-muted">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-tp-secondary"
            aria-hidden
          >
            {initialsFrom(plan.creator_name)}
          </span>
          <span className="truncate">
            {plan.creator_name?.trim() ? plan.creator_name : "You"}
          </span>
        </span>
      </div>

      <div className="plan-card-actions">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/plans/${plan.id}`)}
          className="plan-action-btn"
          style={{
            background: tokens.chip,
            borderColor: tokens.chipBorder,
            color: tokens.chipText,
          }}
        >
          <Eye size={14} />
          View
        </button>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/plans/${plan.id}/edit`)}
          className="plan-action-btn"
          style={{
            background: tokens.chip,
            borderColor: tokens.chipBorder,
            color: tokens.chipText,
          }}
        >
          <Pencil size={14} />
          Edit
        </button>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={deleting}
            className={cn(
              "plan-action-btn plan-action-delete",
              deleting && "opacity-60"
            )}
          >
            <Trash2 size={14} />
            Delete
          </button>
        ) : (
          <div className="plan-action-confirm">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
              className="plan-action-btn plan-action-confirm-yes"
              disabled={deleting}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="plan-action-btn plan-action-confirm-no"
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatDivider() {
  return <div className="plan-card-stat-divider" aria-hidden />;
}

function StatItem({
  icon,
  value,
  label,
  colorKey,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorKey: keyof typeof PLAN_COLORS;
}) {
  const tokens = PLAN_COLORS[colorKey];
  return (
    <div className="plan-card-stat">
      <span
        className="plan-card-stat-icon"
        style={{ color: tokens.accent }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="plan-card-stat-value">{value}</span>
      <span className="plan-card-stat-label">{label}</span>
    </div>
  );
}

function StatusBadge({
  status,
  planColor,
}: {
  status: string;
  planColor: keyof typeof PLAN_COLORS;
}) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === "active") {
    return (
      <span className="badge-status-active shrink-0 text-[11px]">{label}</span>
    );
  }
  if (status === "completed") {
    return (
      <span className="badge-status-neutral shrink-0 text-[11px]">{label}</span>
    );
  }

  // Default/draft — tinted with the plan color so the card reads cohesively.
  const tokens = PLAN_COLORS[planColor];
  return (
    <span
      className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        background: tokens.chip,
        borderColor: tokens.chipBorder,
        color: tokens.chipText,
      }}
    >
      {label}
    </span>
  );
}
