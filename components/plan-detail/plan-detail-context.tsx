"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  PLAN_COLORS,
  type PlanColorKey,
  type PlanColorTokens,
} from "@/lib/constants/plan-colors";
import type { PlanDetail } from "@/lib/plan-detail/types";

type PlanDetailContextValue = {
  planId: string;
  detail: PlanDetail;
  colorKey: PlanColorKey;
  tokens: PlanColorTokens;
  selectedCompetitorId: string | null;
  setSelectedCompetitorId: (competitorId: string) => void;
};

const PlanDetailContext = createContext<PlanDetailContextValue | null>(null);

export function PlanDetailProvider({
  planId,
  detail,
  selectedCompetitorId,
  setSelectedCompetitorId,
  children,
}: {
  planId: string;
  detail: PlanDetail;
  selectedCompetitorId: string | null;
  setSelectedCompetitorId: (competitorId: string) => void;
  children: ReactNode;
}) {
  const value = useMemo<PlanDetailContextValue>(() => {
    const colorKey = detail.plan.color;
    return {
      planId,
      detail,
      colorKey,
      tokens: PLAN_COLORS[colorKey],
      selectedCompetitorId,
      setSelectedCompetitorId,
    };
  }, [planId, detail, selectedCompetitorId, setSelectedCompetitorId]);

  return (
    <PlanDetailContext.Provider value={value}>
      {children}
    </PlanDetailContext.Provider>
  );
}

export function usePlanDetailContext() {
  const ctx = useContext(PlanDetailContext);
  if (!ctx) {
    throw new Error(
      "usePlanDetailContext must be used within <PlanDetailProvider>"
    );
  }
  return ctx;
}
