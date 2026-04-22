"use client";

import { Button } from "@/components/ui/button";
import { PhasePickerCreateBlockCard } from "@/components/training-plans/phase-picker-create-block-card";
import type { Subcompetence } from "@/lib/training-plans/types";

type BlockValue = {
  name: string;
  subcompetence_id: string | null;
  gate_pass_threshold: number | null;
};

type BlockField = {
  id: string;
};

type PhasePickerCreateBlocksProps = {
  blockFields: BlockField[];
  blocks: BlockValue[];
  selectedSubcompetenceIds: string[];
  subcompetences: Subcompetence[];
  onAddBlock: () => void;
  onRemoveBlock: (index: number) => void;
  onBlockNameChange: (index: number, name: string) => void;
  onBlockSubcompetenceChange: (index: number, subcompetenceId: string | null) => void;
  onBlockPassThresholdChange: (index: number, threshold: number | null) => void;
};

export function PhasePickerCreateBlocks({
  blockFields,
  blocks,
  selectedSubcompetenceIds,
  subcompetences,
  onAddBlock,
  onRemoveBlock,
  onBlockNameChange,
  onBlockSubcompetenceChange,
  onBlockPassThresholdChange,
}: PhasePickerCreateBlocksProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-tp-primary">Blocks</div>
        <Button type="button" size="sm" variant="outline" onClick={onAddBlock}>
          Add block
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {blockFields.map((f, idx) => (
          <PhasePickerCreateBlockCard
            key={f.id}
            index={idx}
            isLast={idx === blockFields.length - 1}
            block={blocks[idx]}
            selectedSubcompetenceIds={selectedSubcompetenceIds}
            subcompetences={subcompetences}
            onRemove={() => onRemoveBlock(idx)}
            onNameChange={(name) => onBlockNameChange(idx, name)}
            onSubcompetenceChange={(subcompetenceId) =>
              onBlockSubcompetenceChange(idx, subcompetenceId)
            }
            onPassThresholdChange={(threshold) =>
              onBlockPassThresholdChange(idx, threshold)
            }
          />
        ))}
      </div>
    </div>
  );
}

