"use client";

import { useTransition } from "react";
import { updateBlock } from "@/actions/blocks";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { Tag } from "@/components/ui/Tag";
import type { BlockVM } from "@/lib/plan-view-model";

/**
 * A finished block. The design deliberately compresses these — only the block
 * being worked on gets a full card, so the eye lands on the current work
 * instead of scanning identical cards.
 */
export function CompactBlockRow({
  block,
  planId,
  handle,
}: {
  block: BlockVM;
  planId: string;
  handle?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="tp-card tp-quiet-host" style={{ padding: "12px 16px", borderLeft: "3px solid var(--pos)" }}>
      <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="tp-col" style={{ gap: 4, minWidth: 0 }}>
          <InlineEdit
            value={block.title}
            ariaLabel="Block title"
            disabled={pending}
            style={{ fontSize: 14, fontWeight: 600 }}
            onSubmit={(title) =>
              startTransition(async () => {
                await updateBlock({
                  planId,
                  blockId: block.id,
                  title,
                  description: block.description,
                  verbLevel: block.verbLevel,
                  competenceType: block.competenceType,
                });
              })
            }
          />
          <Tag type={block.competenceType} className="tp-self-start" />
        </div>
        <div className="tp-row tp-gap-2">
          <span
            className="tp-pill tp-pill-mono"
            style={{ background: "var(--pos-soft)", color: "var(--pos)", borderColor: "transparent" }}
          >
            {block.verbLevel}
          </span>
          {handle}
        </div>
      </div>
    </div>
  );
}
