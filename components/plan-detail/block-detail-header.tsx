"use client";

import type { BlockItem } from "@/lib/plan-detail/types";

type BlockDetailHeaderProps = {
  block: BlockItem;
  weekRange: string | null;
  subcompetenceLabel: string | null;
  subcompetenceChipStyle: React.CSSProperties;
  subcompetenceColor: string;
  Icon: React.ComponentType<{ size?: number | string }>;
};

export function BlockDetailHeader({
  block,
  weekRange,
  subcompetenceLabel,
  subcompetenceChipStyle,
  subcompetenceColor,
  Icon,
}: BlockDetailHeaderProps): React.JSX.Element {
  return (
    <header className="plan-block-detail__header">
      <div className="plan-block-detail__title-row">
        <span style={{ color: subcompetenceColor }} aria-hidden>
          <Icon size={24} />
        </span>
        <h2>{block.name}</h2>
      </div>
      <div className="plan-block-detail__meta">
        {subcompetenceLabel ? (
          <span
            className="plan-block-detail__sc-chip subcompetence-chip"
            style={subcompetenceChipStyle}
          >
            {subcompetenceLabel}
          </span>
        ) : null}
        {weekRange ? <span className="plan-block-detail__week">{weekRange}</span> : null}
      </div>
      {block.description ? (
        <p className="plan-block-detail__description">{block.description}</p>
      ) : null}
    </header>
  );
}

