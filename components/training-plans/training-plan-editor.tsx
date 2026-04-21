"use client";

import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  GripVertical,
  Info,
  Layers,
  Loader2,
  Save,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhasePickerPopover } from "@/components/training-plans/phase-picker-popover";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PLAN_COLORS,
  PLAN_COLOR_KEYS,
  resolvePlanColor,
  type PlanColorKey,
} from "@/lib/constants/planColors";
import { subcompetenceChipStyle } from "@/lib/constants/subcompetenceTokens";
import { useIsDark } from "@/lib/use-is-dark";
import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import type {
  GateType,
  Phase,
  PlanDraft,
  PlanPhaseRef,
  Subcompetence,
  TrainingPlanStatus,
} from "@/lib/training-plans/types";
import { useTrainingPlanSave } from "@/lib/training-plans/use-training-plan-autosave";
import { cn } from "@/lib/utils";

type Orientation = "horizontal" | "vertical";

function StatusPills({
  value,
  onChange,
}: {
  value: TrainingPlanStatus;
  onChange: (v: TrainingPlanStatus) => void;
}) {
  const opts: TrainingPlanStatus[] = ["draft", "active", "completed"];
  const labels: Record<TrainingPlanStatus, string> = {
    draft: "Draft",
    active: "Active",
    completed: "Completed",
  };
  return (
    <div className="flex gap-2">
      {opts.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "tp-plan-status-pill rounded-full border px-[14px] py-[5px] text-[13px] transition-all",
            opt === value
              ? "is-active font-semibold"
              : "is-inactive text-tp-secondary hover:text-[var(--color-text-accent)]"
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

function SaveIndicator({
  state,
  canSave,
  errorMessage,
}: {
  state: "idle" | "dirty" | "saving" | "saved" | "error";
  canSave: boolean;
  errorMessage?: string | null;
}) {
  if (state === "idle") return null;

  if (state === "dirty") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-tp-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        {canSave ? "Unsaved changes" : "Fill required fields to save"}
      </div>
    );
  }

  if (state === "saving") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-tp-muted">
        <Loader2 className="h-[14px] w-[14px] animate-spin" />
        Saving…
      </div>
    );
  }

  if (state === "saved") {
    return (
      <div className="flex items-center gap-2 text-[12px] text-positive">
        <CheckCircle className="h-[14px] w-[14px]" />
        Saved
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-[12px] text-negative"
      title={errorMessage ?? undefined}
    >
      <AlertCircle className="h-[14px] w-[14px]" />
      Save failed
    </div>
  );
}

function SortablePhaseCard({
  item,
  expanded,
  onToggleExpanded,
  onRemove,
}: {
  item: PlanPhaseRef;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.phase_id });
  const isDark = useIsDark();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "tp-plan-phase-card relative rounded-xl border p-3",
        isDragging && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-negative/90 hover:bg-negative/10"
        aria-label="Remove phase"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 cursor-grab rounded-md p-1 text-tp-muted hover:bg-[var(--hover-tint-bg)]"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers
              className="h-[18px] w-[18px] shrink-0"
              style={{
                color:
                  item.phase.subcompetences[0]?.color ?? "var(--color-accent)",
              }}
            />
            <div className="truncate text-sm font-semibold text-tp-primary">
              {item.phase.name}
            </div>
            {item.phase.duration_weeks ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                {item.phase.duration_weeks}w
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.phase.subcompetences.map((s) => (
              <span
                key={s.id}
                className="subcompetence-chip px-2 py-0.5 text-xs"
                style={subcompetenceChipStyle(s.color, isDark)}
              >
                {s.name}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-tp-muted">
            <span>{item.phase.blocks.length} blocks</span>
            <span>{item.phase.blocks.length} gates</span>
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              aria-controls={`phase-details-${item.phase_id}`}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--hover-tint-bg)]"
            >
              {expanded ? "Collapse" : "Expand"}
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200 ease-out",
                  expanded && "rotate-90"
                )}
              />
            </button>
          </div>

          <div
            id={`phase-details-${item.phase_id}`}
            className={cn(
              "mt-3 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 border-t border-border/60 pt-3">
                {item.phase.blocks.length ? (
                  <div>
                    <div className="text-xs font-semibold text-tp-primary">Blocks</div>
                    <div className="mt-2 space-y-1.5">
                      {item.phase.blocks
                        .slice()
                        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                        .map((b, bi, arr) => {
                          const sc = item.phase.subcompetences.find(
                            (s) => s.id === b.subcompetence_id
                          );
                          const { Icon, colorLight, colorDark } =
                            getSubcompetenceIcon(sc);
                          const isPhaseGate =
                            bi === arr.length - 1 && b.gate.gate_type === "phase_gate";
                          const GateIcon = isPhaseGate ? ShieldCheck : Shield;
                          return (
                            <div key={`${item.phase_id}-blk-${b.id ?? b.order_index}`}>
                              <div className="flex items-center gap-2 text-xs text-tp-secondary">
                                <Icon
                                  size={16}
                                  className="shrink-0 dark:hidden"
                                  style={{ color: colorLight }}
                                />
                                <Icon
                                  size={16}
                                  className="hidden shrink-0 dark:block"
                                  style={{ color: colorDark }}
                                />
                                <span className="truncate">{b.name}</span>
                              </div>

                              <div className="mt-1 flex items-center justify-between gap-3 pl-6 text-[11px] text-tp-muted">
                                <span className="flex min-w-0 items-center gap-2">
                                  <GateIcon
                                    size={14}
                                    className="shrink-0"
                                    style={{
                                      color: isPhaseGate
                                        ? "var(--color-positive)"
                                        : "var(--color-accent)",
                                    }}
                                  />
                                  <span className="truncate">{b.gate.name}</span>
                                </span>
                                {typeof b.gate.pass_threshold === "number" ? (
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-full border px-2 py-0.5 text-tp-primary",
                                      isPhaseGate
                                        ? "border-[var(--color-positive-border)] bg-[var(--color-positive-bg)]"
                                        : "border-[var(--color-border-hover)] bg-[var(--color-accent-muted)]"
                                    )}
                                  >
                                    {b.gate.pass_threshold}%
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {/* Gates are shown inline under each block now. */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortablePreviewPhase({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-80")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function recomputeOffsets(list: PlanPhaseRef[]) {
  let acc = 0;
  return list.map((r, idx) => {
    const out: PlanPhaseRef = {
      ...r,
      order_index: idx + 1,
      start_offset_weeks: acc,
    };
    acc += r.phase.duration_weeks ?? 0;
    return out;
  });
}

export function TrainingPlanEditor({ planId }: { planId?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const isDark = useIsDark();

  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [draft, setDraft] = useState<PlanDraft>({
    id: planId,
    name: "",
    description: "",
    status: "draft",
    start_date: "",
    color: "blue",
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [phaseRefs, setPhaseRefs] = useState<PlanPhaseRef[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error("Not authenticated");
      setProfileId(data.user.id);
      return data.user.id;
    },
  });

  const auto = useTrainingPlanSave({
    draft,
    createdBy: profileId ?? "",
    enabled: Boolean(profileId),
    onFirstSave: (id) => {
      router.replace(`/dashboard/plans/${id}/edit`);
      setDraft((d) => ({ ...d, id }));
    },
  });

  const { data: subcompetences = [] } = useQuery({
    queryKey: ["subcompetences"],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcompetences")
        .select("id,name,description,color,icon")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Subcompetence[];
    },
  });

  const { data: phases = [] } = useQuery({
    queryKey: ["phases"],
    enabled: Boolean(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phases")
        .select(
          "id,name,description,duration_weeks,order_index, phase_subcompetences(subcompetence_id, subcompetences(id,name,description,color,icon)), topics(id,name,description,order_index,subcompetence_id, gate:gates!topics_gate_id_fkey(id,name,description,gate_type,pass_threshold))"
        )
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
      return rows.map((p) => {
        const psc = (p["phase_subcompetences"] ?? []) as unknown as Array<{
          subcompetences?: Subcompetence | null;
        }>;
        const scs = psc.map((x) => x.subcompetences).filter(Boolean) as Subcompetence[];

        const topics = (p["topics"] ?? []) as unknown as Array<{
          id: string;
          name: string;
          description: string | null;
          order_index: number;
          subcompetence_id: string | null;
          gate: {
            id: string;
            name: string;
            description: string | null;
            gate_type: "phase_gate" | "block_gate";
            pass_threshold: number | null;
          } | null;
        }>;
        const blocks = topics.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          order_index: t.order_index,
          subcompetence_id: t.subcompetence_id,
          gate: t.gate
            ? {
                id: t.gate.id,
                name: t.gate.name,
                description: t.gate.description,
                gate_type: t.gate.gate_type,
                pass_threshold: t.gate.pass_threshold,
              }
            : {
                name: `${t.name} Gate`,
                gate_type: "block_gate" as GateType,
                pass_threshold: 70,
              },
        }));

        const phase: Phase = {
          id: p["id"] as string,
          name: p["name"] as string,
          description: (p["description"] as string | null) ?? null,
          duration_weeks: (p["duration_weeks"] as number | null) ?? null,
          order_index: (p["order_index"] as number | null) ?? null,
          subcompetences: scs,
          blocks,
        };
        return phase;
      }) as Phase[];
    },
  });

  useQuery({
    queryKey: ["training-plan-editor", planId, phases.length],
    enabled: Boolean(planId) && Boolean(profileId) && phases.length > 0,
    queryFn: async () => {
      const { data: planRow, error: planErr } = await supabase
        .from("training_plans")
        .select("id,name,description,status,start_date,color")
        .eq("id", planId as string)
        .single();
      if (planErr) throw planErr;

      const { data: tpp, error: tppErr } = await supabase
        .from("training_plan_phases")
        .select("phase_id,order_index,start_offset_weeks")
        .eq("training_plan_id", planId as string)
        .order("order_index", { ascending: true });
      if (tppErr) throw tppErr;

      const phaseMap = new Map(phases.map((p) => [p.id, p]));
      const rows = (tpp ?? []) as unknown as Array<{
        phase_id: string;
        order_index: number;
        start_offset_weeks: number | null;
      }>;
      const refs = rows
        .map((row) => {
          const ph = phaseMap.get(row.phase_id);
          if (!ph) return null;
          const ref: PlanPhaseRef = {
            phase_id: row.phase_id,
            order_index: row.order_index,
            start_offset_weeks: row.start_offset_weeks ?? 0,
            phase: ph,
          };
          return ref;
        })
        .filter(Boolean) as PlanPhaseRef[];

      const loadedColor = resolvePlanColor(
        (planRow as unknown as { color?: unknown }).color
      );
      setDraft({
        id: planRow.id,
        name: planRow.name ?? "",
        description: planRow.description ?? "",
        status: (planRow.status ?? "draft") as TrainingPlanStatus,
        start_date: planRow.start_date ?? "",
        color: loadedColor,
      });
      setPhaseRefs(refs);
      auto.markSavedHash(
        JSON.stringify({
          id: planRow.id,
          name: planRow.name ?? "",
          description: planRow.description ?? "",
          status: planRow.status ?? "draft",
          start_date: planRow.start_date ?? "",
          color: loadedColor,
        })
      );
      return true;
    },
  });

  const existingDisabled = useMemo(() => new Set(phaseRefs.map((p) => p.phase_id)), [phaseRefs]);

  const totalWeeks = useMemo(
    () => phaseRefs.reduce((s, r) => s + (r.phase.duration_weeks ?? 0), 0),
    [phaseRefs]
  );

  const weekLabel = (r: PlanPhaseRef) => {
    const start = r.start_offset_weeks + 1;
    const dur = r.phase.duration_weeks ?? 0;
    const end = r.start_offset_weeks + dur;
    if (!dur) return "Weeks —";
    return `Week ${start}-${end}`;
  };

  function addExistingPhase(phase: Phase) {
    if (phaseRefs.some((p) => p.phase_id === phase.id)) return;
    const next = recomputeOffsets([
      ...phaseRefs,
      {
        phase_id: phase.id,
        order_index: phaseRefs.length + 1,
        start_offset_weeks: 0,
        phase,
      },
    ]);
    setPhaseRefs(next);
    auto.markExternalDirty();
  }

  function removePhase(phaseId: string) {
    const next = recomputeOffsets(
      phaseRefs.filter((p) => p.phase_id !== phaseId)
    );
    setPhaseRefs(next);
    auto.markExternalDirty();
  }

  function onReorder(activeId: string, overId: string) {
    const oldIndex = phaseRefs.findIndex((p) => p.phase_id === activeId);
    const newIndex = phaseRefs.findIndex((p) => p.phase_id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const moved = arrayMove(phaseRefs, oldIndex, newIndex);
    const next = recomputeOffsets(moved);
    setPhaseRefs(next);
    auto.markExternalDirty();
  }

  async function reconcilePhases(planIdToUse: string) {
    const desired = recomputeOffsets(phaseRefs);
    const desiredIds = new Set(desired.map((r) => r.phase_id));

    const { data: existing, error: existingErr } = await supabase
      .from("training_plan_phases")
      .select("phase_id")
      .eq("training_plan_id", planIdToUse);
    if (existingErr) throw existingErr;

    const toDelete = ((existing ?? []) as Array<{ phase_id: string }>)
      .map((r) => r.phase_id)
      .filter((id) => !desiredIds.has(id));

    if (toDelete.length) {
      const { error } = await supabase
        .from("training_plan_phases")
        .delete()
        .eq("training_plan_id", planIdToUse)
        .in("phase_id", toDelete);
      if (error) throw error;
    }

    if (desired.length) {
      const rows = desired.map((r) => ({
        training_plan_id: planIdToUse,
        phase_id: r.phase_id,
        order_index: r.order_index,
        start_offset_weeks: r.start_offset_weeks,
      }));
      const { error } = await supabase
        .from("training_plan_phases")
        .upsert(rows, { onConflict: "training_plan_id,phase_id" });
      if (error) throw error;
    }
  }

  async function handleSave() {
    try {
      const id = await auto.save();
      await reconcilePhases(id);
      auto.markExternalClean();
    } catch {
      // Error surface is driven by the hook's state/errorMessage.
    }
  }

  const planColorTokens = PLAN_COLORS[draft.color];

  const editorStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
    // Custom properties consumed by .tp-plan-* CSS.
    ["--plan-tint" as string]: planColorTokens.bg,
    ["--plan-tint-strong" as string]: planColorTokens.bgStrong,
    ["--plan-chip-border" as string]: planColorTokens.chipBorder,
    ["--plan-accent" as string]: planColorTokens.accent,
    ["--plan-accent-hover" as string]: planColorTokens.accentHover,
    ["--plan-glow" as string]: planColorTokens.glow,
    ["--plan-border" as string]: planColorTokens.border,
  };

  return (
    <div className="tp-plan-editor" style={editorStyle}>
      <div className="tp-plan-cancelbar">
        <button
          type="button"
          className="tp-plan-cancel-btn"
          onClick={() => router.push("/dashboard/plans")}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="tp-plan-split">
        <div className="tp-plan-left">
          <div className="tp-plan-left-header">
            <div className="min-w-0">
              <div className="tp-plan-left-header-title">Plan details</div>
              <div className="tp-plan-left-header-subtitle">
                {auto.state === "dirty" ? "Unsaved changes" : "Manual save"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SaveIndicator
                state={auto.state}
                canSave={auto.canSave}
                errorMessage={auto.errorMessage}
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!auto.canSave || auto.state === "saving"}
                className="tp-plan-save-btn"
                title={
                  !auto.canSave
                    ? "Fill in the plan name (min 3 chars) and start date."
                    : undefined
                }
              >
                {auto.state === "saving" ? (
                  <>
                    <Loader2 className="h-[14px] w-[14px] animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-[14px] w-[14px]" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="tp-plan-left-body">
            <div className="tp-plan-form">
              <div>
                <Label className="tp-plan-label">
                  Plan name <span className="text-negative">*</span>
                </Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Phase 1 — Foundation Track"
                  className="tp-plan-input"
                />
              </div>

              <div>
                <Label className="tp-plan-label">Description</Label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="What does this training plan cover?"
                  rows={3}
                  className="tp-plan-textarea"
                />
              </div>

              <div>
                <Label className="tp-plan-label">Plan color</Label>
                <div className="tp-plan-color-swatches">
                  {PLAN_COLOR_KEYS.map((key) => {
                    const tokens = PLAN_COLORS[key];
                    const selected = draft.color === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`Plan color: ${tokens.label}`}
                        aria-pressed={selected}
                        onClick={() =>
                          setDraft((d) => ({ ...d, color: key as PlanColorKey }))
                        }
                        className={cn(
                          "tp-plan-color-swatch",
                          selected && "is-selected"
                        )}
                        style={
                          {
                            background: tokens.border,
                            ["--swatch-glow" as string]: tokens.glow,
                          } as React.CSSProperties
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="tp-plan-row">
                <div className="flex-1">
                  <Label className="tp-plan-label">
                    Start date <span className="text-negative">*</span>
                  </Label>
                  <div className="tp-plan-date-wrap">
                    <Input
                      type="date"
                      value={draft.start_date}
                      onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                      className="tp-plan-input"
                    />
                    <Calendar className="tp-plan-date-icon" />
                  </div>
                </div>
                <div>
                  <Label className="tp-plan-label">Status</Label>
                  <StatusPills
                    value={draft.status}
                    onChange={(v) => setDraft((d) => ({ ...d, status: v }))}
                  />
                </div>
              </div>
            </div>

            <div className="tp-plan-phases">
              <div className="tp-plan-phases-header">
                <div className="tp-plan-phases-title">
                  <Layers className="h-4 w-4 text-[var(--color-accent)]" />
                  Phases
                </div>
                {profileId ? (
                  <PhasePickerPopover
                    existingPhases={phases}
                    existingDisabledIds={existingDisabled}
                    subcompetences={subcompetences}
                    createdBy={profileId}
                    planPhaseCount={phaseRefs.length}
                    planColor={draft.color}
                    onAddExisting={addExistingPhase}
                    onCreated={async (phase) => {
                      await addExistingPhase(phase);
                    }}
                    triggerClassName="tp-add-phase-btn"
                  />
                ) : null}
              </div>

              {phaseRefs.length === 0 ? (
                <div className="tp-plan-phases-empty">
                  No phases yet. Use <span className="text-tp-primary">Add Phase</span> to build your roadmap.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) => {
                    if (over && active.id !== over.id) void onReorder(String(active.id), String(over.id));
                  }}
                >
                  <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {phaseRefs.map((p) => (
                        <SortablePhaseCard
                          key={p.phase_id}
                          item={p}
                          expanded={Boolean(expanded[p.phase_id])}
                          onToggleExpanded={() =>
                            setExpanded((e) => ({ ...e, [p.phase_id]: !e[p.phase_id] }))
                          }
                          onRemove={() => void removePhase(p.phase_id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <div className="tp-plan-right">
          <div className="tp-plan-right-header">
            <div className="min-w-0">
              <div className="tp-plan-right-title">Roadmap Preview</div>
              <div className="tp-plan-right-subtitle">
                {draft.name ? draft.name : "Untitled plan"}
              </div>
            </div>
            <div className="tp-plan-toggle">
              <button
                type="button"
                onClick={() => setOrientation("horizontal")}
                className={cn("tp-plan-toggle-btn", orientation === "horizontal" && "is-active")}
                aria-label="Horizontal layout"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOrientation("vertical")}
                className={cn("tp-plan-toggle-btn", orientation === "vertical" && "is-active")}
                aria-label="Vertical layout"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="tp-plan-canvas">
            {phaseRefs.length === 0 ? (
              <div className="tp-plan-canvas-empty">
                <ChevronLeft className="tp-plan-canvas-empty-icon" />
                <div className="tp-plan-canvas-empty-text">Add your first phase on the left</div>
              </div>
            ) : orientation === "horizontal" ? (
              <div className="h-full w-full overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToHorizontalAxis]}
                  onDragEnd={({ active, over }) => {
                    if (over && active.id !== over.id) void onReorder(String(active.id), String(over.id));
                  }}
                >
                  <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex min-h-[180px] w-full items-stretch gap-4">
                      <AnimatePresence initial={false}>
                        {phaseRefs.map((r, idx) => {
                          const dur = r.phase.duration_weeks ?? 0;
                          const frac = totalWeeks ? dur / totalWeeks : 1 / Math.max(phaseRefs.length, 1);
                          const grow = Math.max(frac, 0.08);
                          const accent = r.phase.subcompetences[0]?.color ?? "var(--color-accent)";
                          const phaseGate = r.phase.blocks[r.phase.blocks.length - 1]?.gate?.gate_type === "phase_gate"
                            ? r.phase.blocks[r.phase.blocks.length - 1].gate
                            : undefined;
                          return (
                            <motion.div
                              key={r.phase_id}
                              layout
                              layoutId={`phase-${r.phase_id}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className="relative min-w-0"
                              style={{ flex: `${grow} 1 0`, minWidth: 0 }}
                            >
                              <SortablePreviewPhase id={r.phase_id}>
                                <div
                                  className="tp-phase-block relative flex h-full min-h-[160px] w-full min-w-0 cursor-grab flex-col overflow-hidden p-3 active:cursor-grabbing"
                                  style={{
                                    borderLeft: `3px solid ${accent}`,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-tp-primary">
                                        <Layers
                                          size={14}
                                          className="shrink-0"
                                          style={{ color: accent }}
                                        />
                                        <span className="truncate">{r.phase.name}</span>
                                      </div>
                                      <div className="mt-0.5 truncate text-xs text-tp-muted">{weekLabel(r)}</div>
                                    </div>
                                    {phaseGate ? (
                                      <div
                                        className="max-w-[50%] shrink-0 truncate rounded-full border border-[var(--color-accent)]/55 bg-[var(--color-accent)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)] backdrop-blur-sm"
                                        title={phaseGate.name}
                                      >
                                        PG
                                        {typeof phaseGate.pass_threshold === "number"
                                          ? ` ${phaseGate.pass_threshold}%`
                                          : ""}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {r.phase.subcompetences.slice(0, 4).map((s) => (
                                      <span
                                        key={s.id}
                                        className="subcompetence-chip max-w-full truncate px-2 py-0.5 text-[11px]"
                                        style={subcompetenceChipStyle(s.color, isDark)}
                                        title={s.name}
                                      >
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-tp-muted">
                                    <span className="inline-flex items-center gap-1">
                                      <Code2 size={14} />
                                      {r.phase.blocks.length} blocks
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <Shield size={14} />
                                      {r.phase.blocks.length} gates
                                    </span>
                                  </div>

                                  {phaseGate ? (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-[var(--color-accent)]" />
                                  ) : null}
                                </div>
                              </SortablePreviewPhase>

                              {idx < phaseRefs.length - 1 ? (
                                <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                                  <ChevronRight className="h-4 w-4 text-[var(--color-accent)]/80" />
                                </div>
                              ) : null}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={({ active, over }) => {
                    if (over && active.id !== over.id) void onReorder(String(active.id), String(over.id));
                  }}
                >
                  <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {phaseRefs.map((r, idx) => {
                          const accent = r.phase.subcompetences[0]?.color ?? "var(--color-accent)";
                          return (
                            <motion.div
                              key={r.phase_id}
                              layout
                              layoutId={`phase-${r.phase_id}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3 }}
                              className="relative"
                            >
                              <SortablePreviewPhase id={r.phase_id}>
                                <div className="tp-phase-block flex cursor-grab gap-3 p-4 active:cursor-grabbing">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="h-full w-[3px] rounded-full" style={{ background: accent }} />
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-[var(--color-surface)] text-xs font-semibold text-tp-primary">
                                      {idx + 1}
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-tp-primary">
                                      <Layers size={18} style={{ color: accent }} />
                                      <span className="truncate">{r.phase.name}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-tp-muted">{weekLabel(r)}</div>
                                  </div>
                                </div>
                              </SortablePreviewPhase>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tp-plan-tipbar">
        <div className="tp-plan-tip">
          <Info className="h-[13px] w-[13px]" />
          Tip: drag phases in the left list or directly in the preview to reorder.
        </div>
      </div>
    </div>
  );
}

