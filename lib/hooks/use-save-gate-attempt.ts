"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { nextBlockIdAfterPass } from "@/lib/plan-detail/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GateItem, PlanDetail } from "@/lib/plan-detail/types";

type SaveGateAttemptArgs = {
  selectedCompetitor: string;
  date: string;
  numericScore: number;
  notes: string;
};

type SaveGateAttemptResult = {
  passed: boolean;
  score: number;
};

type UseSaveGateAttemptProps = {
  gate: GateItem;
  planId: string;
  detail: PlanDetail;
  competitorName: string;
  onDone?: () => void;
  onReset: () => void;
};

export function useSaveGateAttempt({
  gate,
  planId,
  detail,
  competitorName,
  onDone,
  onReset,
}: UseSaveGateAttemptProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectedCompetitor,
      date,
      numericScore,
      notes,
    }: SaveGateAttemptArgs): Promise<SaveGateAttemptResult> => {
      if (!selectedCompetitor) throw new Error("Pick a competitor");
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error("Score must be between 0 and 100");
      }

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const insertRes = await supabase
        .from("gate_attempts")
        .insert({
          gate_id: gate.id,
          competitor_id: selectedCompetitor,
          training_plan_id: planId,
          attempt_date: date,
          score: numericScore,
          notes: notes.trim() || null,
          recorded_by: uid,
        })
        .select("id,passed,score")
        .single();

      if (insertRes.error) {
        throw insertRes.error;
      }

      const inserted = insertRes.data as { passed: boolean; score: number };

      // Any first attempt means the competitor has started the plan.
      // Without this, a competitor can show "Not started" while having attempts
      // (because progress only advanced on PASS previously).
      const progress = detail.progressByCompetitor.get(selectedCompetitor);
      const shouldMarkStarted =
        progress?.status === "not_started" ||
        !progress?.started_at ||
        !progress?.current_topic_id;

      if (shouldMarkStarted) {
        const fallbackBlockId = detail.orderedBlockIds[0] ?? null;
        const nextTopicId = progress?.current_topic_id ?? fallbackBlockId;
        const nextPhaseId =
          progress?.current_phase_id ??
          (nextTopicId ? detail.blocksById.get(nextTopicId)?.phase_id ?? null : null);

        await supabase
          .from("competitor_progress")
          .update({
            status: "in_progress",
            started_at: progress?.started_at ?? new Date().toISOString(),
            current_topic_id: nextTopicId,
            current_phase_id: nextPhaseId,
          })
          .eq("competitor_id", selectedCompetitor)
          .eq("training_plan_id", planId);
      }

      // On block_gate pass → advance current_topic_id.
      if (inserted.passed && gate.gate_type === "block_gate") {
        const { nextBlockId, nextPhaseId } = nextBlockIdAfterPass(detail, selectedCompetitor);
        if (nextBlockId) {
          await supabase
            .from("competitor_progress")
            .update({
              current_topic_id: nextBlockId,
              current_phase_id: nextPhaseId,
              status: "in_progress",
              started_at: new Date().toISOString(),
            })
            .eq("competitor_id", selectedCompetitor)
            .eq("training_plan_id", planId);
        } else {
          await supabase
            .from("competitor_progress")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("competitor_id", selectedCompetitor)
            .eq("training_plan_id", planId);
        }
      }

      return inserted;
    },
    onSuccess: (inserted) => {
      if (inserted.passed) {
        toast.success(`${competitorName} — Gate passed`);
      } else {
        toast.error(`${competitorName} — Gate failed. Score: ${inserted.score}%`);
      }
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      onReset();
      onDone?.();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to save attempt";
      toast.error(msg);
    },
  });
}

