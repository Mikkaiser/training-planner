"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

export interface SortablePreviewPhaseProps {
  id: string;
  children: React.ReactNode;
}

export function SortablePreviewPhase({ id, children }: SortablePreviewPhaseProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-80")}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

