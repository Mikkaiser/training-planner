import {
  CalendarRange,
  Layers,
  Map,
  Puzzle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your training plans and content."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[rgba(244,253,217,0.65)]">Total plans</div>
            <Map className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-2 text-3xl font-semibold text-secondary">—</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[rgba(244,253,217,0.65)]">Active plans</div>
            <CalendarRange className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-2 text-3xl font-semibold text-secondary">—</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[rgba(244,253,217,0.65)]">Total phases</div>
            <Layers className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-2 text-3xl font-semibold text-secondary">—</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[rgba(244,253,217,0.65)]">
              Total exercises
            </div>
            <Puzzle className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-2 text-3xl font-semibold text-secondary">—</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard className="p-4 lg:col-span-2">
          <div className="text-sm font-medium text-secondary">Recent training plans</div>
          <div className="mt-3 text-sm text-[rgba(244,253,217,0.6)]">
            Seed data will show here once Supabase is set up.
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm font-medium text-secondary">Quick actions</div>
          <div className="mt-3 space-y-2 text-sm text-[rgba(244,253,217,0.6)]">
            <div>New Training Plan</div>
            <div>New Phase</div>
            <div>New Subcompetence</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

