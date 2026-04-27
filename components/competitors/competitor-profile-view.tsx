"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Archive, Pencil, Plus, Trash2 } from "lucide-react";

import { AddEditCompetitorDialog } from "@/components/competitors/add-edit-competitor-dialog";
import { initialsFromName } from "@/components/competitors/competitor-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useArchiveCompetitor } from "@/lib/hooks/use-archive-competitor";
import { useCompetitor } from "@/lib/hooks/use-competitor";
import { useDeleteCompetitor } from "@/lib/hooks/use-delete-competitor";
import { CompetitorProfileSkeleton } from "@/components/shared/skeletons";
import { cn } from "@/lib/utils";

function formatDate(value: string | null): string {
  if (!value) return "-";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return "-";
  }
}

export function CompetitorProfileView({ competitorId }: { competitorId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [editingOpen, setEditingOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showArchiveWarning, setShowArchiveWarning] = useState(false);

  const { data, isLoading, isError, error } = useCompetitor(competitorId);
  const archiveMutation = useArchiveCompetitor(competitorId);
  const deleteMutation = useDeleteCompetitor(competitorId);

  const hasHistory = useMemo(
    () => (data?.gate_history.length ?? 0) > 0,
    [data?.gate_history.length]
  );
  const activeEntry = useMemo(
    () =>
      data?.plan_history.find(
        (item) =>
          item.participation_status === "active" &&
          item.training_plan_id === data.active_plan_id
      ) ?? null,
    [data?.active_plan_id, data?.plan_history]
  );
  const activeProgressPercent =
    activeEntry && activeEntry.gates_total_count > 0
      ? Math.round((activeEntry.gates_passed_count / activeEntry.gates_total_count) * 100)
      : 0;

  if (isLoading) {
    return <CompetitorProfileSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load competitor: {error instanceof Error ? error.message : "Unknown error."}
      </div>
    );
  }

  const from = pathname.startsWith("/") ? pathname : `/competitors/${data.id}`;
  const personalPlanHref = `/plans/new?personalFor=${data.id}&from=${encodeURIComponent(from)}`;

  return (
    <div className="space-y-6">
      <header className="competitor-profile-header">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-sm text-tp-secondary">
            <Link href="/competitors" className="hover:underline">
              Competitors
            </Link>
            <span>/</span>
            <span className="text-tp-primary">{data.full_name}</span>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push("/competitors")}>
            <ArrowLeft size={14} />
            Back
          </Button>
        </div>

        <div className="competitor-profile-header__main">
          <span className="competitor-profile-header__avatar" style={{ background: data.avatar_color }}>
            {initialsFromName(data.full_name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-bold text-tp-primary">{data.full_name}</h1>
            {data.email?.trim() ? (
              <p className="mt-1 text-sm text-tp-muted">{data.email}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setEditingOpen(true)}>
            <Pencil size={14} />
            Edit Competitor
          </Button>
          <Link
            href={personalPlanHref}
            className={cn(buttonVariants({ variant: "default" }), "inline-flex items-center gap-1.5")}
          >
            <Plus size={14} />
            Create Personal Plan
          </Link>
          {!confirmDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={archiveMutation.isPending || deleteMutation.isPending}
              onClick={() => {
                setConfirmDelete(true);
                setShowArchiveWarning(false);
              }}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={archiveMutation.isPending || deleteMutation.isPending}
                onClick={async () => {
                  if (hasHistory) {
                    setShowArchiveWarning(true);
                    return;
                  }
                  await deleteMutation.mutateAsync();
                  router.push("/competitors");
                }}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>

        {showArchiveWarning ? (
          <div className="competitor-card__warning">
            <p>
              This competitor has gate attempt history. Archive them instead to preserve
              records.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={archiveMutation.isPending}
              onClick={async () => {
                await archiveMutation.mutateAsync();
                router.push("/competitors");
              }}
            >
              <Archive size={14} />
              Archive
            </Button>
          </div>
        ) : null}
      </header>

      <section className="competitor-section-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-tp-primary">Active Plan</h2>
          {data.active_plan ? (
            <Link href={`/plans/${data.active_plan.id}`} className={buttonVariants({ variant: "outline" })}>
              View Plan
            </Link>
          ) : null}
        </div>

        {data.active_plan ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-tp-primary">
                {data.active_plan.name ?? "Untitled plan"}
              </p>
              <p className="text-sm text-tp-secondary">
                {data.active_plan.plan_type === "personal" ? "Personal" : "Shared"} plan
              </p>
            </div>
            <div className="space-y-1 text-sm text-tp-secondary">
              <p>Status: {data.active_plan.status ?? "draft"}</p>
              <p>Start date: {formatDate(data.active_plan.start_date)}</p>
              <p>Current block: {data.active_block_name ?? "-"}</p>
            </div>
            <div className="md:col-span-2">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${activeProgressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-tp-muted">
                Phase progress: {activeEntry?.gates_passed_count ?? 0}/
                {activeEntry?.gates_total_count ?? 0} gates ({activeProgressPercent}%)
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-border p-4">
            <p className="text-sm text-tp-secondary">No active plan for this competitor.</p>
            <Link
              href={personalPlanHref}
              className={cn(buttonVariants({ variant: "default" }), "mt-3 inline-flex")}
            >
              Create Personal Plan
            </Link>
          </div>
        )}
      </section>

      <section className="competitor-section-card">
        <h2 className="text-lg font-semibold text-tp-primary">Plan History</h2>
        <div className="mt-3 space-y-2">
          {data.plan_history.length ? (
            data.plan_history.map((entry) => (
              <div
                key={entry.id}
                className={`competitor-history-row ${entry.participation_status === "archived" ? "competitor-history-row--archived" : ""}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-tp-primary">
                      {entry.plan?.name ?? "Untitled plan"}
                    </p>
                    <span className="competitor-pill">
                      {entry.plan?.plan_type === "personal" ? "Personal" : "Shared"}
                    </span>
                    <span className="competitor-pill">
                      {entry.participation_status === "archived" ? "Archived" : "Active"}
                    </span>
                  </div>
                  <p className="text-sm text-tp-secondary">
                    {formatDate(entry.started_at)} {"->"}{" "}
                    {entry.participation_status === "active"
                      ? "Active"
                      : formatDate(entry.completed_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-tp-secondary">
                    {entry.gates_passed_count}/{entry.gates_total_count} gates passed
                  </span>
                  {entry.plan ? (
                    <Link
                      href={`/plans/${entry.plan.id}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      View Plan
                    </Link>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-tp-secondary">No plan participation yet.</p>
          )}
        </div>
      </section>

      <section className="competitor-section-card">
        <h2 className="text-lg font-semibold text-tp-primary">Gate History</h2>
        <div className="mt-3 space-y-2">
          {data.gate_history.length ? (
            data.gate_history.map((attempt) => (
              <div key={attempt.id} className="competitor-history-row">
                <div className="min-w-0">
                  <p className="font-semibold text-tp-primary">
                    {attempt.gate_name}
                    {attempt.plan_name ? (
                      <span className="text-sm font-normal text-tp-secondary">
                        {" "}
                        · {attempt.plan_name}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-tp-secondary">{formatDate(attempt.attempt_date)}</p>
                  {attempt.notes?.trim() ? (
                    <p className="text-sm text-tp-muted">{attempt.notes}</p>
                  ) : null}
                </div>
                <span
                  className={`competitor-score-badge ${
                    attempt.passed ? "competitor-score-badge--passed" : "competitor-score-badge--failed"
                  }`}
                >
                  {attempt.score}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-tp-secondary">No gate attempts yet.</p>
          )}
        </div>
      </section>

      <AddEditCompetitorDialog
        mode="edit"
        open={editingOpen}
        onOpenChange={setEditingOpen}
        competitorId={data.id}
        initialFullName={data.full_name}
        initialEmail={data.email}
        initialAvatarColor={data.avatar_color}
      />
    </div>
  );
}
