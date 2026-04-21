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
    <div className="space-y-[30px]">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your training plans and content."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <GlassCard className="!rounded-[18px] !px-[30px] !py-[25px]">
          <div className="flex items-center justify-between">
            <div className="text-[16px] text-tp-muted">Total plans</div>
            <Map className="size-[30px] text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !px-[30px] !py-[25px]">
          <div className="flex items-center justify-between">
            <div className="text-[16px] text-tp-muted">Active plans</div>
            <CalendarRange className="size-[30px] text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !px-[30px] !py-[25px]">
          <div className="flex items-center justify-between">
            <div className="text-[16px] text-tp-muted">Total phases</div>
            <Layers className="size-[30px] text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !px-[30px] !py-[25px]">
          <div className="flex items-center justify-between">
            <div className="text-[16px] text-tp-muted">
              Total exercises
            </div>
            <Puzzle className="size-[30px] text-tp-accent-label" />
          </div>
          <div className="stat-number mt-2">—</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 !rounded-[18px] !px-[30px] !py-[25px]">
          <div className="text-[21px] font-semibold text-tp-primary">
            Recent training plans
          </div>
          <div className="mt-3 text-sm text-tp-secondary">
            Seed data will show here once Supabase is set up.
          </div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !px-[30px] !py-[25px]">
          <div className="text-[21px] font-semibold text-tp-primary">
            Quick actions
          </div>
          <div className="mt-3 flex flex-col gap-[13px]">
            <Link
              href="/dashboard/plans/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "h-[55px] w-full justify-center rounded-[13px] text-[18px] font-semibold"
              )}
            >
              New Training Plan
            </Link>
            <Link
              href="/dashboard/phases/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "h-[55px] w-full justify-center rounded-[13px] text-[18px] font-semibold"
              )}
            >
              New Phase
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
