"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { planDetailQueryKey } from "@/lib/plan-detail/use-plan-detail";
import { nextBlockIdAfterPass } from "@/lib/plan-detail/progress";
import type { GateItem } from "@/lib/plan-detail/types";

export function GateAttemptForm({
  gate,
  competitorId,
  onDone,
  lockedCompetitor = false,
}: {
  gate: GateItem;
  competitorId?: string;
  onDone?: () => void;
  /** When true, hide the competitor picker and always use `competitorId`. */
  lockedCompetitor?: boolean;
}) {
  const { detail, planId } = usePlanDetailContext();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);

  const [selectedCompetitor, setSelectedCompetitor] = useState<string>(
    competitorId ?? detail.competitors[0]?.id ?? ""
  );
  const [score, setScore] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");

  const threshold = gate.pass_threshold ?? 0;
  const numericScore = Number.parseInt(score, 10);
  const hasValidScore =
    !Number.isNaN(numericScore) && numericScore >= 0 && numericScore <= 100;
  const willPass = hasValidScore && numericScore >= threshold;

  const competitorName = useMemo(() => {
    const c = detail.competitors.find((x) => x.id === selectedCompetitor);
    return c?.full_name ?? "Competitor";
  }, [detail.competitors, selectedCompetitor]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedCompetitor) throw new Error("Pick a competitor");
      if (!hasValidScore) throw new Error("Score must be between 0 and 100");

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
        const { nextBlockId, nextPhaseId } = nextBlockIdAfterPass(
          detail,
          selectedCompetitor
        );
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
        toast.error(
          `${competitorName} — Gate failed. Score: ${inserted.score}%`
        );
      }
      queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) });
      setScore("");
      setNotes("");
      onDone?.();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to save attempt";
      toast.error(msg);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="plan-attempt-form"
    >
      {!lockedCompetitor ? (
        <div className="plan-attempt-form__row">
          <Label htmlFor="attempt-competitor" className="tp-plan-label">
            Competitor
          </Label>
          <div className="plan-attempt-form__select-wrap">
            <select
              id="attempt-competitor"
              className="glass-input plan-attempt-form__select"
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
            >
              {detail.competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <span className="plan-attempt-form__field-icon" aria-hidden>
              <ChevronDown size={16} />
            </span>
          </div>
        </div>
      ) : null}

      <div className="plan-attempt-form__grid">
        <div className="plan-attempt-form__field">
          <Label htmlFor="attempt-score" className="tp-plan-label">
            Score (0–100)
            <span className="plan-attempt-form__required" aria-hidden>
              *
            </span>
          </Label>
          <Input
            id="attempt-score"
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="glass-input plan-attempt-form__score"
          />
          {hasValidScore ? (
            <div
              className="plan-attempt-form__preview"
              data-pass={willPass ? "true" : "false"}
            >
              {willPass ? (
                <>
                  <CheckCircle size={14} />
                  <span>Will PASS</span>
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  <span>Will FAIL · needs {threshold}%</span>
                </>
              )}
            </div>
          ) : null}
        </div>
        <div className="plan-attempt-form__field">
          <Label htmlFor="attempt-date" className="tp-plan-label">
            Date
            <span className="plan-attempt-form__required" aria-hidden>
              *
            </span>
          </Label>
          <AttemptDatePicker value={date} onChange={setDate} />
        </div>
      </div>

      <div className="plan-attempt-form__divider" aria-hidden />

      <div className="plan-attempt-form__row">
        <Label htmlFor="attempt-notes" className="tp-plan-label">
          Notes
        </Label>
        <textarea
          id="attempt-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observations, strengths, areas to improve..."
          className="glass-input plan-attempt-form__textarea"
        />
      </div>

      <div className="plan-attempt-form__actions">
        <button
          type="button"
          onClick={onDone}
          className="plan-attempt-form__cancel"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="tp-plan-save-btn plan-attempt-form__save"
          disabled={mutation.isPending}
          style={{ background: "var(--plan-accent, var(--color-accent))" }}
        >
          <Plus size={14} />
          <span>{mutation.isPending ? "Saving…" : "Save Attempt"}</span>
        </button>
      </div>
    </form>
  );
}

function AttemptDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(
    selected ? startOfMonth(selected) : startOfMonth(new Date())
  );

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);

  // Start the grid on Monday.
  const startDay = (start.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const gridStart = addDays(start, -startDay);

  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const displayValue = selected ? format(selected, "dd/MM/yyyy") : "";

  return (
    <Popover>
      <PopoverTrigger
        className="glass-input plan-attempt-form__date-btn"
        role="button"
        aria-label="Pick date"
      >
        <span className={displayValue ? "" : "plan-attempt-form__date-placeholder"}>
          {displayValue || "Select a date"}
        </span>
        <span className="plan-attempt-form__date-icon" aria-hidden>
          <Calendar size={16} />
        </span>
      </PopoverTrigger>

      <PopoverContent className="plan-attempt-form__date-popover">
        <div className="plan-attempt-form__date-head">
          <button
            type="button"
            className="plan-attempt-form__date-nav hover-tint"
            onClick={() => setViewMonth((m) => startOfMonth(subMonths(m, 1)))}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="plan-attempt-form__date-title">
            {format(viewMonth, "MMMM yyyy")}
          </div>
          <button
            type="button"
            className="plan-attempt-form__date-nav hover-tint"
            onClick={() => setViewMonth((m) => startOfMonth(addMonths(m, 1)))}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="plan-attempt-form__date-weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="plan-attempt-form__date-weekday">
              {d}
            </div>
          ))}
        </div>

        <div className="plan-attempt-form__date-grid">
          {days.map((day) => {
            const isOutside = day < start || day > end;
            const dayKey = format(day, "yyyy-MM-dd");
            const isSelected = value === dayKey;
            const isToday = dayKey === format(new Date(), "yyyy-MM-dd");

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => onChange(dayKey)}
                className="plan-attempt-form__date-day"
                data-outside={isOutside ? "true" : undefined}
                data-selected={isSelected ? "true" : undefined}
                data-today={isToday ? "true" : undefined}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
