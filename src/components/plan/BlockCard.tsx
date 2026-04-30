"use client";

import { useTransition } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { deleteBlock, updateBlock } from "@/actions/blocks";
import { Button } from "@/components/ui/Button";
import { GhostButton } from "@/components/ui/GhostButton";
import { Tag } from "@/components/ui/Tag";
import type { Block } from "@/lib/types";

interface BlockCardProps {
  block: Block;
  planId: string;
  active?: boolean;
}

export function BlockCard({ block, planId, active = false }: BlockCardProps) {
  const [pending, startTransition] = useTransition();

  const handleEdit = () => {
    const nextTitle = window.prompt("Block title", block.title);
    if (!nextTitle) return;

    startTransition(async () => {
      await updateBlock({
        planId,
        blockId: block.id,
        title: nextTitle,
        description: block.description,
        verbLevel: block.verb_level,
        competenceType: block.competence_type,
        hours: block.hours,
      });
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this block?")) return;
    startTransition(async () => {
      await deleteBlock(planId, block.id);
    });
  };

  return (
    <article className={`tp-card ${active ? "tp-card-active" : ""}`} style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ display: "grid", gap: "6px" }}>
          <Tag type={block.competence_type} />
          <h4 style={{ margin: 0, fontSize: "28px", letterSpacing: "-0.02em" }}>{block.title}</h4>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: "13px", lineHeight: 1.5 }}>{block.description}</p>
        </div>
        <span className="tp-pill tp-pill-mono">{block.verb_level}</span>
      </div>

      <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
        <div className="tp-file">
          <div className="tp-file-icon">PDF</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Exercise pack</div>
            <div style={{ fontSize: "12px", color: "var(--ink-2)" }}>Attach references as needed</div>
          </div>
          <Upload size={14} color="var(--ink-2)" />
        </div>
        <GhostButton>Add Exercise</GhostButton>
      </div>

      <div style={{ marginTop: "14px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" disabled={pending} onClick={handleEdit}>
          <Pencil size={13} />
          Edit
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={handleDelete}>
          <Trash2 size={13} />
          Delete
        </Button>
      </div>
    </article>
  );
}
