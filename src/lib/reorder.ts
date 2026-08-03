/**
 * Pure reordering helpers.
 *
 * Kept out of the components so the rules can be tested without a browser, and
 * out of the actions so they can be tested without a database.
 */

/** Moves one item, returning a new array. Indices outside the range are clamped. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (next.length === 0) return next;

  const clamp = (index: number) => Math.min(Math.max(index, 0), next.length - 1);
  const source = clamp(from);
  const target = clamp(to);
  if (source === target) return next;

  const [moved] = next.splice(source, 1);
  next.splice(target, 0, moved);
  return next;
}

/** True when both lists describe the same order, so a no-op drag writes nothing. */
export function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * True when both lists hold the same ids regardless of order.
 *
 * The reorder actions use this idea server-side: a caller that omits an id, or
 * slips in one from another plan, must be rejected rather than silently
 * reordering part of the list and leaving the rest with stale positions.
 */
export function isSameMembership(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;

  const setA = new Set(a);
  const setB = new Set(b);
  // Both sides must be duplicate-free. Checking only one lets ["a","a"] pass
  // against ["a","b"]: every element is present, and the lengths agree.
  if (setA.size !== a.length || setB.size !== b.length) return false;

  for (const id of setA) if (!setB.has(id)) return false;
  return true;
}
