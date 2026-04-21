"use client";

import { UserPlus } from "lucide-react";
import { motion } from "framer-motion";

import { usePlanDetailContext } from "@/components/plan-detail/plan-detail-context";
import {
  initialsFromName,
  progressPercentForCompetitor,
} from "@/lib/plan-detail/progress";

export function CompetitorLegend({
  onAddCompetitor,
}: {
  onAddCompetitor: () => void;
}) {
  const { detail } = usePlanDetailContext();

  return (
    <div className="plan-detail-legend">
      {detail.competitors.map((c) => {
        const percent = progressPercentForCompetitor(detail, c.id);
        return (
          <motion.div
            key={c.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="plan-detail-legend__chip"
          >
            <span
              className="plan-detail-legend__avatar"
              style={{
                background: c.avatar_color,
                color: "#ffffff",
              }}
              aria-hidden
            >
              {initialsFromName(c.full_name)}
            </span>
            <span className="plan-detail-legend__meta">
              <span
                className="plan-detail-legend__name"
                style={{ color: c.avatar_color }}
              >
                {c.full_name}
              </span>
              <div className="plan-detail-legend__progress-wrap">
                <div className="plan-detail-legend__progress-track">
                  <div
                    className="plan-detail-legend__progress-fill"
                    style={{
                      width: `${percent}%`,
                      background: c.avatar_color,
                    }}
                  />
                </div>
                <span className="plan-detail-legend__progress-label">
                  {percent}%
                </span>
              </div>
            </span>
          </motion.div>
        );
      })}
      <button
        type="button"
        onClick={onAddCompetitor}
        className="plan-detail-legend__add"
      >
        <UserPlus size={14} />
        <span>Add</span>
      </button>
    </div>
  );
}
