"use client";

import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExerciseCompletionRow } from "@/components/plan-detail/exercise-completion-row";
import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import { useAppProfile } from "@/lib/hooks/use-app-profile";
import { useExerciseCompletions } from "@/lib/hooks/use-exercise-completions";
import type { ExerciseCategory } from "@/lib/plan-detail/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type BlockDetailExercisesProps = {
  categories: ExerciseCategory[];
  accentColor: string;
};

export function BlockDetailExercises({
  categories,
  accentColor,
}: BlockDetailExercisesProps): React.JSX.Element {
  const { planId, selectedCompetitorId } = usePlanDetailContext();
  const { data: profile } = useAppProfile();
  const { data: completionMap = new Map() } = useExerciseCompletions(
    planId,
    selectedCompetitorId
  );

  const markedByIds = useMemo(() => {
    const ids = new Set<string>();
    for (const completion of completionMap.values()) {
      if (completion.marked_by) ids.add(completion.marked_by);
    }
    return [...ids];
  }, [completionMap]);

  const { data: markerNames = new Map<string, string>() } = useQuery({
    queryKey: ["exercise-marker-names", ...markedByIds],
    enabled: markedByIds.length > 0,
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", markedByIds);
      if (error) throw error;

      const names = new Map<string, string>();
      for (const row of (data ?? []) as Array<{ id: string; full_name: string | null }>) {
        if (!row.full_name) continue;
        names.set(row.id, row.full_name);
      }
      return names;
    },
  });

  const allExercises = categories.flatMap((category) => category.exercises ?? []);
  const completedCount = allExercises.reduce((count, exercise) => {
    const completion = completionMap.get(exercise.id);
    return completion?.completed ? count + 1 : count;
  }, 0);
  const progressPercent =
    allExercises.length > 0 ? Math.round((completedCount / allExercises.length) * 100) : 0;
  const canEdit = profile?.role === "admin" || profile?.role === "instructor";

  return (
    <section className="plan-block-detail__section">
      <div className="flex items-center justify-between gap-3">
        <h3>
          <BookOpen size={16} style={{ color: accentColor }} />
          <span>Exercises</span>
        </h3>
        <span className="text-[12px] text-tp-secondary">
          {completedCount} / {allExercises.length} completed
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-[4px] bg-[var(--color-border)]">
        <div
          className="h-full rounded-[4px] bg-[var(--color-accent)] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="plan-block-detail__exercises">
        {categories.length === 0 ? (
          <div className="plan-block-detail__exercises-empty">
            No exercises yet for this block.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="space-y-2">
              <h4 className="text-xs font-semibold text-tp-secondary">{category.name}</h4>
              {(category.exercises ?? []).map((exercise) => {
                const completion = completionMap.get(exercise.id) ?? null;
                return selectedCompetitorId ? (
                  <ExerciseCompletionRow
                    key={exercise.id}
                    exercise={exercise}
                    completion={completion}
                    competitorId={selectedCompetitorId}
                    planId={planId}
                    isInstructor={canEdit}
                    currentUserId={profile?.userId ?? null}
                    markedByName={
                      completion?.marked_by
                        ? markerNames.get(completion.marked_by) ?? null
                        : null
                    }
                  />
                ) : null;
              })}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

