"use client";

import Link from "next/link";
import { Map as MapIcon, Plus } from "lucide-react";

export function PlansEmptyState(): React.JSX.Element {
  return (
    <div className="glass-panel glass-panel--subtle flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
      <MapIcon className="h-12 w-12 text-[var(--color-accent)] opacity-40" />
      <div className="mt-4 text-lg font-semibold text-tp-primary">
        No training plans yet
      </div>
      <div className="mt-1 text-sm text-tp-muted">
        Create your first plan to start building your roadmap
      </div>
      <Link
        href="/plans/new"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-cta hover:bg-[var(--color-accent-hover,var(--color-accent))]"
      >
        <Plus className="h-4 w-4" />
        New Training Plan
      </Link>
    </div>
  );
}

