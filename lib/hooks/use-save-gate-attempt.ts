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

type InsertedAttempt = {
  id: string;
  gate_id: string;
  competitor_id: string;
  training_plan_id: string;
  attempt_date: string;
  score: number;
  passed: boolean;
  created_at: string;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  recorded_by: string | null;
};

type UseSaveGateAttemptProps = {
  gate: GateItem;
  planId: string;
  detail: PlanDetail;
  onDone?: () => void;
  onReset: () => void;
};

function competitorNameById(detail: PlanDetail, competitorId: string) {
  return detail.competitors.find((c) => c.id === competitorId)?.full_name ?? "Competitor";
}

export function useSaveGateAttempt({
  gate,
  planId,
  detail,
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
    }: SaveGateAttemptArgs): Promise<InsertedAttempt> => {
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
        .select("id,gate_id,competitor_id,training_plan_id,attempt_date,score,passed,created_at,notes")
        .single();

      if (insertRes.error) {
        throw insertRes.error;
      }

      const inserted = insertRes.data as InsertedAttempt;

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
    onSuccess: (inserted, variables) => {
      // Update the plan detail cache immediately so rings/badges update without waiting.
      queryClient.setQueryData(planDetailQueryKey(planId), (current: PlanDetail | undefined) => {
        if (!current) return current;

        const attempt = inserted;
        const attemptsByGate = new Map(current.attemptsByGate);
        const prevAttempts = attemptsByGate.get(attempt.gate_id) ?? [];
        attemptsByGate.set(attempt.gate_id, [attempt, ...prevAttempts]);

        const latestAttemptByGateAndCompetitor = new Map(current.latestAttemptByGateAndCompetitor);
        latestAttemptByGateAndCompetitor.set(
          `${attempt.gate_id}:${attempt.competitor_id}`,
          attempt
        );

        const progressByCompetitor = new Map(current.progressByCompetitor);
        const prevProgress = progressByCompetitor.get(attempt.competitor_id);
        if (prevProgress) {
          const next = { ...prevProgress };
          const shouldMarkStarted =
            next.status === "not_started" || !next.started_at || !next.current_topic_id;
          if (shouldMarkStarted) {
            const fallbackBlockId = current.orderedBlockIds[0] ?? null;
            const nextTopicId = next.current_topic_id ?? fallbackBlockId;
            const nextPhaseId =
              next.current_phase_id ??
              (nextTopicId ? current.blocksById.get(nextTopicId)?.phase_id ?? null : null);
            next.status = "in_progress";
            next.started_at = next.started_at ?? new Date().toISOString();
            next.current_topic_id = nextTopicId;
            next.current_phase_id = nextPhaseId;
          }

          if (attempt.passed && gate.gate_type === "block_gate") {
            const { nextBlockId, nextPhaseId } = nextBlockIdAfterPass(current, attempt.competitor_id);
            if (nextBlockId) {
              next.current_topic_id = nextBlockId;
              next.current_phase_id = nextPhaseId;
              next.status = "in_progress";
              next.started_at = next.started_at ?? new Date().toISOString();
            } else {
              next.status = "completed";
              next.completed_at = next.completed_at ?? new Date().toISOString();
            }
          }

          progressByCompetitor.set(attempt.competitor_id, next);
        }

        return {
          ...current,
          attemptsByGate,
          latestAttemptByGateAndCompetitor,
          progressByCompetitor,
        };
      });

      const competitorName = competitorNameById(detail, variables.selectedCompetitor);
      if (inserted.passed) {
        toast.success(`${competitorName} — Gate passed`);
      } else {
        toast.error(`${competitorName} — Gate failed. Score: ${inserted.score}%`);
      }
      onReset();
      onDone?.();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to save attempt";
      toast.error(msg);
    },
  });
}

