"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteBlock, updateBlock } from "@/actions/blocks";
import { BlockFormModal, type BlockFormValues } from "@/components/plan/BlockFormModal";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import type { Block } from "@/lib/types";

interface BlockCardProps {
  block: Block;
  planId: string;
  active?: boolean;
}

export function BlockCard({ block, planId, active = false }: BlockCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleEdit = async (values: BlockFormValues) => {
    await updateBlock({
      planId,
      phaseId: block.phase_id,
      blockId: block.id,
      title: values.title,
      description: values.description,
      verbLevel: values.verbLevel,
      competenceType: values.competenceType,
      hours: values.hours,
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this block?")) return;
    startTransition(async () => {
      await deleteBlock(planId, block.phase_id, block.id);
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

      <div style={{ marginTop: "12px", color: "var(--ink-2)", fontSize: "12px" }}>{block.hours}h</div>

      <div style={{ marginTop: "14px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditOpen(true)}>
          <Pencil size={13} />
          Edit
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={handleDelete}>
          <Trash2 size={13} />
          Delete
        </Button>
      </div>

      <BlockFormModal
        open={editOpen}
        title="Edit Block"
        submitLabel="Save Changes"
        initialValues={{
          title: block.title,
          description: block.description,
          verbLevel: block.verb_level,
          competenceType: block.competence_type,
          hours: block.hours,
        }}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </article>
  );
}
