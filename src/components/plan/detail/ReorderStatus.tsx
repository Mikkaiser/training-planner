"use client";

/**
 * What happened to a drag, after the pointer was released.
 *
 * A reorder used to commit with no indication of any kind: the hook returned a
 * `pending` flag that no view read, and a rejected action left the new order on
 * screen looking saved. The move is optimistic, so without this the only
 * difference between a reorder that stored and one that did not was that the
 * items quietly went back at some later refresh.
 *
 * Shared by all three views, because all three drive the same hook.
 */
export function ReorderStatus({
  pending,
  error,
  onDismiss,
}: {
  pending: boolean;
  error: string | null;
  onDismiss: () => void;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="tp-row tp-gap-3"
        style={{
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 12px",
          marginBottom: 12,
          borderRadius: 10,
          background: "var(--neg-soft)",
          border: "1px solid var(--neg)",
        }}
      >
        <span className="tp-tiny" style={{ fontWeight: 600, color: "var(--neg)" }}>
          {error} The order has been put back.
        </span>
        <button type="button" className="tp-btn tp-btn-ghost tp-btn-sm" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="tp-tiny tp-mut" aria-live="polite" style={{ minHeight: 16, marginBottom: 4 }}>
      {pending ? "Saving the new order…" : null}
    </div>
  );
}
