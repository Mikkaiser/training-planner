"use client";

import { Users } from "lucide-react";

import { initialsFromName, getCompetitorBlockPresentation } from "@/lib/plan-detail/progress";
import type { PlanDetail } from "@/lib/plan-detail/types";

type BlockDetailCompetitorsProps = {
  detail: PlanDetail;
  blockId: string;
  accentColor: string;
};

export function BlockDetailCompetitors({
  detail,
  blockId,
  accentColor,
}: BlockDetailCompetitorsProps): React.JSX.Element {
  return (
    <section className="plan-block-detail__section">
      <h3>
        <Users size={16} style={{ color: accentColor }} />
        <span>Competitor Status</span>
      </h3>
      <div className="plan-block-detail__competitors">
        {detail.competitors.map((c) => {
          const presentation = getCompetitorBlockPresentation(detail, c.id, blockId);
          return (
            <div key={c.id} className="plan-block-detail__competitor">
              <span
                className="plan-block-detail__competitor-avatar"
                style={{ background: c.avatar_color }}
                aria-hidden
              >
                {initialsFromName(c.full_name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="plan-block-detail__competitor-name">{c.full_name}</div>
                {presentation.showProgress && presentation.progressPercent != null ? (
                  <div className="plan-block-detail__competitor-progress">
                    <div className="plan-block-detail__competitor-track">
                      <div
                        className="plan-block-detail__competitor-fill"
                        style={{
                          width: `${presentation.progressPercent}%`,
                          background: c.avatar_color,
                        }}
                      />
                    </div>
                    <span className="plan-block-detail__competitor-score">
                      Last attempt: {presentation.progressPercent}%
                    </span>
                  </div>
                ) : null}
              </div>
              <span
                className="plan-block-detail__competitor-pill"
                data-color={presentation.color}
              >
                {presentation.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

