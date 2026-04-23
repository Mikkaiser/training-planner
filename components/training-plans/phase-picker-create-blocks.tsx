"use client";

import { Button } from "@/components/ui/button";
import { PhasePickerCreateBlockCard } from "@/components/training-plans/phase-picker-create-block-card";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { UploadResult } from "@/lib/storage/storage";
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
  createdBy: string;
  planColor: PlanColorKey;
  exerciseUploads: Array<UploadResult | null>;
  onAddBlock: () => void;
  onRemoveBlock: (index: number) => void;
  onBlockNameChange: (index: number, name: string) => void;
  onBlockSubcompetenceChange: (index: number, subcompetenceId: string | null) => void;
  onBlockPassThresholdChange: (index: number, threshold: number | null) => void;
  onBlockExerciseUploadChange: (index: number, upload: UploadResult | null) => void;
};

export function PhasePickerCreateBlocks({
  blockFields,
  blocks,
  selectedSubcompetenceIds,
  subcompetences,
  createdBy,
  planColor,
  exerciseUploads,
  onAddBlock,
  onRemoveBlock,
  onBlockNameChange,
  onBlockSubcompetenceChange,
  onBlockPassThresholdChange,
  onBlockExerciseUploadChange,
}: PhasePickerCreateBlocksProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-bold text-tp-primary">Blocks</div>
        <Button type="button" size="sm" variant="ghost" onClick={onAddBlock}>
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
            createdBy={createdBy}
            planColor={planColor}
            exerciseUpload={exerciseUploads[idx] ?? null}
            onRemove={() => onRemoveBlock(idx)}
            onNameChange={(name) => onBlockNameChange(idx, name)}
            onSubcompetenceChange={(subcompetenceId) =>
              onBlockSubcompetenceChange(idx, subcompetenceId)
            }
            onPassThresholdChange={(threshold) =>
              onBlockPassThresholdChange(idx, threshold)
            }
            onExerciseUploadChange={(upload) => onBlockExerciseUploadChange(idx, upload)}
          />
        ))}
      </div>
    </div>
  );
}

