"use client";

import { useMemo, useState } from "react";

import { AddEditCompetitorDialog } from "@/components/competitors/add-edit-competitor-dialog";
import { CompetitorCard } from "@/components/competitors/competitor-card";
import { Button } from "@/components/ui/button";
import { useArchiveCompetitor } from "@/lib/hooks/use-archive-competitor";
import { useDeleteCompetitor } from "@/lib/hooks/use-delete-competitor";
import { useCompetitors } from "@/lib/hooks/use-competitors";
import type { CompetitorListItem } from "@/lib/types/competitors";
import { CompetitorsListingSkeleton } from "@/components/shared/skeletons/competitors-listing-skeleton";

type ManagedCompetitorCardProps = {
  competitor: CompetitorListItem;
  onEdit: (competitor: CompetitorListItem) => void;
};

function ManagedCompetitorCard({ competitor, onEdit }: ManagedCompetitorCardProps) {
  const deleteMutation = useDeleteCompetitor(competitor.id);
  const archiveMutation = useArchiveCompetitor(competitor.id);

  return (
    <CompetitorCard
      competitor={competitor}
      onEdit={() => onEdit(competitor)}
      onDelete={async () => {
        await deleteMutation.mutateAsync();
      }}
      onArchive={async () => {
        await archiveMutation.mutateAsync();
      }}
      deleting={deleteMutation.isPending}
      archiving={archiveMutation.isPending}
    />
  );
}

export function CompetitorsList() {
  const [showArchived, setShowArchived] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CompetitorListItem | null>(null);

  const { data, isLoading, isError, error } = useCompetitors({
    includeArchived: showArchived,
  });

  const competitors = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return <CompetitorsListingSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Failed to load competitors: {error instanceof Error ? error.message : "Unknown error."}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-tp-secondary">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Show archived
        </label>
        <Button type="button" onClick={() => setAddOpen(true)}>
          Add Competitor
        </Button>
      </div>

      {competitors.length ? (
        <div className="plan-grid">
          {competitors.map((competitor) => (
            <ManagedCompetitorCard
              key={competitor.id}
              competitor={competitor}
              onEdit={(item) => setEditing(item)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-[var(--color-surface-raised)] p-8 text-center">
          <p className="text-[17px] font-semibold text-tp-primary">No competitors yet</p>
          <p className="mt-1 text-sm text-tp-secondary">
            Add your first competitor to start tracking personal progress.
          </p>
        </div>
      )}

      <AddEditCompetitorDialog mode="add" open={addOpen} onOpenChange={setAddOpen} />
      <AddEditCompetitorDialog
        mode="edit"
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        competitorId={editing?.id}
        initialFullName={editing?.full_name}
        initialEmail={editing?.email}
        initialAvatarColor={editing?.avatar_color}
      />
    </div>
  );
}
