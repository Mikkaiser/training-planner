"use client";

import * as React from "react";
import { ChevronDown, Search, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCompetitors } from "@/lib/hooks/use-competitors";
import { cn } from "@/lib/utils";

type CompetitorAssignPopoverProps = {
  value: string | null;
  locked?: boolean;
  onChange: (next: string | null) => void;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function CompetitorAssignPopover({
  value,
  locked = false,
  onChange,
}: CompetitorAssignPopoverProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const { data, isLoading, isError } = useCompetitors({ includeArchived: false });

  const competitors = React.useMemo(() => data ?? [], [data]);
  const selected = React.useMemo(
    () => competitors.find((c) => c.id === value) ?? null,
    [competitors, value]
  );

  const filtered = React.useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return competitors;
    return competitors.filter((c) => normalizeQuery(c.full_name).includes(q));
  }, [competitors, query]);

  const label = selected?.full_name ?? "General purpose plan";

  return (
    <div>
      <Label className="tp-plan-label">Competitor</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (locked) return;
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger
          className={cn(
            "group/button inline-flex w-full shrink-0 items-center justify-between gap-3 rounded-lg border border-[color:var(--ghost-outline)] bg-[var(--color-accent-muted)] px-3 py-2 text-left text-sm font-semibold text-primary outline-none select-none",
            "h-auto min-h-9",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:bg-[var(--btn-ghost-hover-bg)] hover:border-[color:var(--btn-ghost-hover-border)]",
            locked && "cursor-not-allowed"
          )}
          disabled={locked}
          aria-label="Assign competitor"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-tp-secondary">
              <User className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-tp-muted" />
        </PopoverTrigger>

        <PopoverContent className="w-[min(520px,92vw)] p-3" aria-label="Competitor search">
          <div className="flex items-center gap-2">
            <span className="text-tp-muted" aria-hidden>
              <Search className="h-4 w-4" />
            </span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search competitor by name…"
              className="tp-plan-input"
              autoFocus
            />
          </div>

          <div className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-border bg-[var(--color-surface-raised)]">
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                "hover:bg-[var(--color-accent-muted)]",
                value === null && "bg-[var(--color-accent-muted)] font-semibold"
              )}
              onClick={() => {
                onChange(null);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-tp-secondary">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 truncate">General purpose plan</span>
            </button>

            <div className="h-px bg-border" aria-hidden />

            {isLoading ? (
              <div className="px-3 py-3 text-sm text-tp-muted">Loading competitors…</div>
            ) : isError ? (
              <div className="px-3 py-3 text-sm text-destructive">
                Failed to load competitors.
              </div>
            ) : filtered.length ? (
              filtered.map((c) => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                      "hover:bg-[var(--color-accent-muted)]",
                      isSelected && "bg-[var(--color-accent-muted)] font-semibold"
                    )}
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: c.avatar_color ?? "var(--color-accent)",
                        color: "var(--color-surface-raised)",
                      }}
                      aria-hidden
                    >
                      {c.full_name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join("")}
                    </span>
                    <span className="min-w-0 truncate">{c.full_name}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-tp-muted">No competitors found.</div>
            )}
          </div>

          {locked ? (
            <p className="mt-2 text-xs text-tp-muted">
              This plan is locked to a competitor.
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

