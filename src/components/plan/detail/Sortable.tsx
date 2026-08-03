"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isSameOrder, moveItem } from "@/lib/reorder";

/** Lets a nested handle reach the useSortable instance of its own item. */
type SortableHandle = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef" | "isDragging"
>;

const HandleContext = createContext<SortableHandle | null>(null);

interface SortableListProps {
  ids: string[];
  onReorder: (orderedIds: string[]) => void;
  label: string;
  /**
   * Stable, unique per list. dnd-kit derives the id of its screen-reader
   * description element from this; left to its own counter it numbers contexts
   * differently on the server and the client, which React reports as a
   * hydration mismatch on aria-describedby.
   */
  contextId: string;
  children: ReactNode;
}

/**
 * Vertical drag-to-reorder.
 *
 * The order is held locally so the list moves with the pointer instead of
 * waiting for the round trip, and is re-seeded whenever the server sends a
 * different order — which also reverts the optimistic move if the action fails.
 */
export function SortableList({ ids, onReorder, label, contextId, children }: SortableListProps) {
  const [order, setOrder] = useState(ids);

  useEffect(() => {
    setOrder((current) => (isSameOrder(current, ids) ? current : ids));
  }, [ids]);

  const sensors = useSensors(
    // A small distance so a click on a card's own buttons is not swallowed by
    // a drag that was never intended.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Space picks up, arrows move, space drops. Without this the feature is
    // mouse-only, and every control here is otherwise keyboard-reachable.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    const next = moveItem(order, from, to);
    setOrder(next);
    onReorder(next);
  };

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: `Press space to start reordering ${label}, arrow keys to move, space to drop, escape to cancel.`,
        },
      }}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Wraps one item so it can be dragged. The handle lives inside, via context. */
export function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <HandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          // Lifts the dragged item above its neighbours without changing layout.
          zIndex: isDragging ? 30 : undefined,
          position: "relative",
          opacity: isDragging ? 0.85 : 1,
        }}
      >
        {children}
      </div>
    </HandleContext.Provider>
  );
}

/**
 * The grip. Hidden until hover or focus, since the design has no handles —
 * .tp-reveal is the same treatment the destructive buttons use.
 */
export function DragHandle({ label }: { label: string }) {
  const context = useContext(HandleContext);
  if (!context) return null;

  return (
    <button
      type="button"
      ref={context.setActivatorNodeRef}
      className="tp-grip tp-reveal"
      aria-label={`Reorder ${label}`}
      style={{ cursor: context.isDragging ? "grabbing" : "grab" }}
      {...context.attributes}
      {...context.listeners}
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
        <circle cx="2.5" cy="2" r="1.2" />
        <circle cx="7.5" cy="2" r="1.2" />
        <circle cx="2.5" cy="7" r="1.2" />
        <circle cx="7.5" cy="7" r="1.2" />
        <circle cx="2.5" cy="12" r="1.2" />
        <circle cx="7.5" cy="12" r="1.2" />
      </svg>
    </button>
  );
}
