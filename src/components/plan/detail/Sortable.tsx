"use client";

import { createContext, useContext, type ReactNode } from "react";
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Drag primitives. The DndContext itself lives in TimelineView, because moving
 * a block between phases requires one context spanning every phase — a context
 * per phase can only ever reorder within it.
 */

type SortableHandle = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners" | "setActivatorNodeRef" | "isDragging"
>;

/** Lets a nested handle reach the useSortable instance of its own item. */
const HandleContext = createContext<SortableHandle | null>(null);

export function useSortableSensors() {
  return useSensors(
    // A small distance so a click on a card's own buttons is not swallowed by
    // a drag that was never intended.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Space picks up, arrows move, space drops. Without this the feature is
    // mouse-only, and every other control here is keyboard-reachable.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function SortableItem({
  id,
  data,
  children,
}: {
  id: string;
  /** Carries the item's kind and container so the drag handlers can route it. */
  data?: Record<string, unknown>;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data,
  });

  return (
    <HandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef, isDragging }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 30 : undefined,
          position: "relative",
          // Kept in the flow but faded, so the gap it will leave stays visible
          // while the overlay follows the pointer.
          opacity: isDragging ? 0.4 : 1,
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
