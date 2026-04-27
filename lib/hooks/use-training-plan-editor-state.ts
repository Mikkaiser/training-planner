"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { PointerSensor, useSensor, useSensors, type SensorDescriptor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQuery } from "@tanstack/react-query";

import { recomputeOffsets } from "@/lib/utils/training-plan-editor-utils";
import { PLAN_COLORS, resolvePlanColor } from "@/lib/constants/plan-colors";
import { useCreatePersonalPlan } from "@/lib/hooks/use-create-personal-plan";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  GateType,
  Phase,
  PlanDraft,
  PlanPhaseRef,
  Subcompetence,
  TrainingPlanStatus,
} from "@/lib/training-plans/types";
import { useTrainingPlanSave } from "@/lib/training-plans/use-training-plan-autosave";

export type Orientation = "horizontal" | "vertical";

export interface TrainingPlanEditorState {
  auto: ReturnType<typeof useTrainingPlanSave>;
  draft: PlanDraft;
  editorStyle: React.CSSProperties;
  existingDisabled: Set<string>;
  expanded: Record<string, boolean>;
  orientation: Orientation;
  phases: Phase[];
  phaseRefs: PlanPhaseRef[];
  profileId: string | null;
  personalContext: { id: string; full_name: string; avatar_color: string | null } | null;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  subcompetences: Subcompetence[];
  totalWeeks: number;
  onAddExistingPhase: (phase: Phase) => void;
  onBackToPlans: () => void;
  onChangeDescription: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeOrientation: (orientation: Orientation) => void;
  onChangeStartDate: (value: string) => void;
  onChangeStatus: (value: TrainingPlanStatus) => void;
  onPickColor: (color: PlanDraft["color"]) => void;
  onRemovePhase: (phaseId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onSave: () => void;
  onToggleExpanded: (phaseId: string) => void;
}

export function useTrainingPlanEditorState(planId?: string): TrainingPlanEditorState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const personalFor = searchParams.get("personalFor");
  const from = searchParams.get("from");
  const createPersonalPlanMutation = useCreatePersonalPlan(personalFor ?? "");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [orientation, setOrientation] = useState<Orientation>("horizontal");
  const [draft, setDraft] = useState<PlanDraft>({
    id: planId,
    name: "",
    description: "",
    status: "draft",
    start_date: "",
    color: "iris",
    plan_type: "shared",
    owner_competitor_id: null,
  });
  const [phaseRefs, setPhaseRefs] = useState<PlanPhaseRef[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: profileId = null } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error("Not authenticated");
      return data.user.id;
    },
  });

  const auto = useTrainingPlanSave({
    draft,
    createdBy: profileId ?? "",
    enabled: Boolean(profileId),
    onFirstSave: (id) => {
      const nextParams = new URLSearchParams();
      if (from && from.startsWith("/") && !from.startsWith("//")) {
        nextParams.set("from", from);
      }
      const queryString = nextParams.toString();
      router.replace(queryString ? `/plans/${id}/edit?${queryString}` : `/plans/${id}/edit`);
      setDraft((d) => ({ ...d, id }));
    },
  });

  const { data: personalPrefill = null } = useQuery({
    queryKey: ["personal-plan-prefill", personalFor],
    enabled: Boolean(personalFor) && !planId,
    queryFn: async () => {
      if (!personalFor) return null;
      const { data, error } = await supabase
        .from("competitors")
        .select("id,full_name,avatar_color")
        .eq("id", personalFor)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data as { id: string; full_name: string; avatar_color: string | null };
    },
  });

  const personalContextId = personalPrefill?.id ?? draft.owner_competitor_id;
  const { data: loadedPersonalContext = null } = useQuery({
    queryKey: ["personal-plan-context", personalContextId],
    enabled: Boolean(personalContextId),
    queryFn: async () => {
      if (!personalContextId) return null;
      const { data, error } = await supabase
        .from("competitors")
        .select("id,full_name,avatar_color")
        .eq("id", personalContextId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data as { id: string; full_name: string; avatar_color: string | null };
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
      // Supabase result typing is broader than this hook needs; we constrain it here.
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

      // The nested select joins are known at query time but not inferred here.
      const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
      return rows.map((p) => {
        // `phase_subcompetences(subcompetences(...))` shape is fixed by the select list.
        const psc = (p["phase_subcompetences"] ?? []) as unknown as Array<{
          subcompetences?: Subcompetence | null;
        }>;
        const scs = psc.map((x) => x.subcompetences).filter(Boolean) as Subcompetence[];

        // `topics(..., gate:gates!...)` shape is fixed by the select list.
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
                // This fallback is only used when a gate is missing from the join.
                gate_type: "block_gate" as GateType,
                pass_threshold: 70,
              },
        }));

        const phase: Phase = {
          // Supabase typing for joined rows is broader than needed; constrain per field.
          id: p["id"] as string,
          // Supabase typing for joined rows is broader than needed; constrain per field.
          name: p["name"] as string,
          // Supabase typing for joined rows is broader than needed; constrain per field.
          description: (p["description"] as string | null) ?? null,
          // Supabase typing for joined rows is broader than needed; constrain per field.
          duration_weeks: (p["duration_weeks"] as number | null) ?? null,
          // Supabase typing for joined rows is broader than needed; constrain per field.
          order_index: (p["order_index"] as number | null) ?? null,
          subcompetences: scs,
          blocks,
        };
        return phase;
      }) as Phase[];
    },
  });

  const { data: loadedPlan = null } = useQuery({
    queryKey: ["training-plan-editor", planId, phases.length],
    enabled: Boolean(planId) && Boolean(profileId) && phases.length > 0,
    queryFn: async () => {
      if (!planId) throw new Error("Missing planId");
      const { data: planRow, error: planErr } = await supabase
        .from("training_plans")
        .select("id,name,description,status,start_date,color,plan_type,owner_competitor_id")
        // Safe: this queryFn only runs when `enabled` is true, but we also guard above.
        .eq("id", planId)
        .single();
      if (planErr) throw planErr;

      const { data: tpp, error: tppErr } = await supabase
        .from("training_plan_phases")
        .select("phase_id,order_index,start_offset_weeks")
        // Safe: this queryFn only runs when `enabled` is true, but we also guard above.
        .eq("training_plan_id", planId)
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

      const loadedColor = resolvePlanColor((planRow as unknown as { color?: unknown }).color);
      return {
        draft: {
          id: planRow.id,
          name: planRow.name ?? "",
          description: planRow.description ?? "",
          status: (planRow.status ?? "draft") as TrainingPlanStatus,
          start_date: planRow.start_date ?? "",
          color: loadedColor,
          plan_type: (planRow.plan_type ?? "shared") as "shared" | "personal",
          owner_competitor_id: (planRow.owner_competitor_id ?? null) as string | null,
        } satisfies PlanDraft,
        phaseRefs: refs,
      };
    },
  });

  const didInitRef = useRef(false);
  useEffect(() => {
    if (!planId || !loadedPlan || didInitRef.current) return;
    didInitRef.current = true;
    setDraft(loadedPlan.draft);
    setPhaseRefs(loadedPlan.phaseRefs);
    auto.markSavedHash(JSON.stringify(loadedPlan.draft));
  }, [auto, loadedPlan, planId]);

  const didPersonalPrefillRef = useRef(false);
  useEffect(() => {
    if (!personalPrefill || planId || didPersonalPrefillRef.current) return;
    didPersonalPrefillRef.current = true;

    const monthYear = new Date().toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const defaultName = `${personalPrefill.full_name} — ${monthYear}`;

    const avatar = (personalPrefill.avatar_color ?? "").toLowerCase();
    const color =
      avatar.includes("7c6af7") || avatar.includes("purple")
        ? "purple"
        : avatar.includes("00a878") || avatar.includes("green")
          ? "mint"
          : avatar.includes("f97316") || avatar.includes("orange")
            ? "coral"
            : avatar.includes("ef4444") || avatar.includes("red")
              ? "coral"
              : avatar.includes("eab308") || avatar.includes("yellow")
                ? "gold"
                : "iris";

    setDraft((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : defaultName,
      color: prev.color === "iris" ? color : prev.color,
      plan_type: "personal",
      owner_competitor_id: personalPrefill.id,
    }));
  }, [personalPrefill, planId]);

  const existingDisabled = useMemo(() => new Set(phaseRefs.map((p) => p.phase_id)), [phaseRefs]);

  const totalWeeks = useMemo(
    () => phaseRefs.reduce((s, r) => s + (r.phase.duration_weeks ?? 0), 0),
    [phaseRefs]
  );

  function onAddExistingPhase(phase: Phase) {
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

  function onRemovePhase(phaseId: string) {
    const next = recomputeOffsets(phaseRefs.filter((p) => p.phase_id !== phaseId));
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

    // Supabase result typing is broader than this function needs; we constrain it here.
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

  async function onSave() {
    try {
      const isFirstSave = !draft.id;
      const id = await auto.save();
      await reconcilePhases(id);
      if (
        isFirstSave &&
        draft.plan_type === "personal" &&
        draft.owner_competitor_id &&
        !createPersonalPlanMutation.isPending
      ) {
        await createPersonalPlanMutation.mutateAsync({ planId: id });
      }
      auto.markExternalClean();
    } catch {
      // Error surface is driven by the hook's state/errorMessage.
    }
  }

  const planColorTokens = PLAN_COLORS[draft.color];
  const canUseFromPath = Boolean(from && from.startsWith("/") && !from.startsWith("//"));
  const personalContext = personalPrefill ?? loadedPersonalContext;

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
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-tint" as string]: planColorTokens.bg,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-tint-strong" as string]: planColorTokens.bgStrong,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-chip-border" as string]: planColorTokens.chipBorder,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-accent" as string]: planColorTokens.accent,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-accent-hover" as string]: planColorTokens.accentHover,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-glow" as string]: planColorTokens.glow,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-border" as string]: planColorTokens.border,
    // CSS custom properties consumed by `globals.css` (not part of `CSSProperties` index signature).
    ["--plan-gradient" as string]: planColorTokens.gradient,
  };

  return {
    auto,
    draft,
    editorStyle,
    existingDisabled,
    expanded,
    orientation,
    phases,
    phaseRefs,
    profileId,
    personalContext,
    sensors,
    subcompetences,
    totalWeeks,
    onAddExistingPhase,
    onBackToPlans: () => router.push(canUseFromPath ? (from as string) : "/plans"),
    onChangeDescription: (value) => setDraft((d) => ({ ...d, description: value })),
    onChangeName: (value) => setDraft((d) => ({ ...d, name: value })),
    onChangeOrientation: setOrientation,
    onChangeStartDate: (value) => setDraft((d) => ({ ...d, start_date: value })),
    onChangeStatus: (value) => setDraft((d) => ({ ...d, status: value })),
    onPickColor: (color) => setDraft((d) => ({ ...d, color })),
    onRemovePhase,
    onReorder,
    onSave: () => void onSave(),
    onToggleExpanded: (phaseId) => setExpanded((e) => ({ ...e, [phaseId]: !e[phaseId] })),
  };
}

