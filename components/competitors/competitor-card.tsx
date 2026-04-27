"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Archive, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CompetitorListItem } from "@/lib/types/competitors";
import { formatGateSummary, initialsFromName } from "@/components/competitors/competitor-utils";

type CompetitorCardProps = {
  competitor: CompetitorListItem;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onArchive: () => Promise<void>;
  deleting: boolean;
  archiving: boolean;
};

export function CompetitorCard({
  competitor,
  onEdit,
  onDelete,
  onArchive,
  deleting,
  archiving,
}: CompetitorCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showArchiveWarning, setShowArchiveWarning] = useState(false);
  const from = pathname.startsWith("/") ? pathname : "/competitors";

  const hasHistory = competitor.gate_attempts_count > 0;

  return (
    <article className="competitor-card">
      <button
        type="button"
        className="competitor-card__content"
        onClick={() => router.push(`/competitors/${competitor.id}`)}
      >
        <div className="competitor-card__header">
          <span
            className="competitor-card__avatar"
            style={{ background: competitor.avatar_color }}
            aria-hidden
          >
            {initialsFromName(competitor.full_name)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-bold text-tp-primary">{competitor.full_name}</h3>
            {competitor.email?.trim() ? (
              <p className="truncate text-[13px] text-tp-muted">{competitor.email}</p>
            ) : null}
          </div>
        </div>

        <div className="competitor-card__plan">
          {competitor.active_plan ? (
            competitor.active_plan.plan_type === "personal" ? (
              <span
                className="competitor-card__badge"
                style={{
                  background: competitor.avatar_color,
                  color: "var(--color-surface-raised)",
                }}
              >
                Personal · {competitor.active_plan.name ?? "Untitled plan"}
              </span>
            ) : (
              <span className="competitor-card__badge competitor-card__badge--shared">
                Shared · {competitor.active_plan.name ?? "Untitled plan"}
              </span>
            )
          ) : (
            <span className="competitor-card__badge competitor-card__badge--muted">
              No active plan
            </span>
          )}
        </div>

        <p className="competitor-card__stats">
          {formatGateSummary(competitor.gates_passed_count, competitor.plans_count)}
        </p>
      </button>

      <div className="competitor-card__actions">
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil size={14} />
          Edit
        </Button>
        <Button
          type="button"
          onClick={() =>
            router.push(
              `/plans/new?personalFor=${competitor.id}&from=${encodeURIComponent(from)}`,
            )
          }
        >
          <Plus size={14} />
          Personal Plan
        </Button>

        {!confirmDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={deleting || archiving}
            onClick={() => {
              setConfirmDelete(true);
              setShowArchiveWarning(false);
            }}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        ) : (
          <div className="competitor-card__confirm">
            <Button
              type="button"
              variant="outline"
              disabled={deleting || archiving}
              onClick={() => {
                setConfirmDelete(false);
                setShowArchiveWarning(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || archiving}
              onClick={async () => {
                if (hasHistory) {
                  setShowArchiveWarning(true);
                  return;
                }
                await onDelete();
                setConfirmDelete(false);
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
            disabled={archiving || deleting}
            onClick={async () => {
              await onArchive();
              setConfirmDelete(false);
              setShowArchiveWarning(false);
            }}
          >
            <Archive size={14} />
            Archive
          </Button>
          <Link href={`/competitors/${competitor.id}`} className="text-sm text-tp-accent-label hover:underline">
            Open profile
          </Link>
        </div>
      ) : null}
    </article>
  );
}
