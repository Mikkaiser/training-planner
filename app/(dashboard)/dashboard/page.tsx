import {
  CalendarRange,
  Layers,
  Map,
  Puzzle,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your training plans and content."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-sm text-tp-muted">Total plans</div>
            <Map className="h-5 w-5 text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-sm text-tp-muted">Active plans</div>
            <CalendarRange className="h-5 w-5 text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-sm text-tp-muted">Total phases</div>
            <Layers className="h-5 w-5 text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-sm text-tp-muted">
              Total exercises
            </div>
            <Puzzle className="h-5 w-5 text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="text-base font-semibold text-tp-primary">
            Recent training plans
          </div>
          <div className="mt-3 text-sm text-tp-secondary">
            Seed data will show here once Supabase is set up.
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-base font-semibold text-tp-primary">
            Quick actions
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/dashboard/plans/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-center"
              )}
            >
              New Training Plan
            </Link>
            <Link
              href="/dashboard/phases/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-center"
              )}
            >
              New Phase
            </Link>
            <Link
              href="/dashboard/subcompetences/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-center"
              )}
            >
              New Subcompetence
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
