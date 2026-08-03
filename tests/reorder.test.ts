import { describe, expect, it } from "vitest";
import { isSameMembership, isSameOrder, moveItem } from "@/lib/reorder";

describe("moveItem", () => {
  const items = ["a", "b", "c", "d"];

  it("moves an item down", () => {
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item up", () => {
    expect(moveItem(items, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("moves to the ends", () => {
    expect(moveItem(items, 0, 3)).toEqual(["b", "c", "d", "a"]);
    expect(moveItem(items, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("returns an equal list when the position does not change", () => {
    expect(moveItem(items, 2, 2)).toEqual(items);
  });

  it("does not mutate the input", () => {
    const original = [...items];
    moveItem(items, 0, 3);
    expect(items).toEqual(original);
  });

  it("keeps every item exactly once", () => {
    const result = moveItem(items, 1, 3);
    expect([...result].sort()).toEqual([...items].sort());
    expect(result).toHaveLength(items.length);
  });

  it("clamps out-of-range indices instead of dropping or duplicating", () => {
    expect(moveItem(items, -5, 1)).toEqual(["b", "a", "c", "d"]);
    expect(moveItem(items, 1, 99)).toEqual(["a", "c", "d", "b"]);
  });

  it("survives empty and single-item lists", () => {
    expect(moveItem([], 0, 1)).toEqual([]);
    expect(moveItem(["only"], 0, 3)).toEqual(["only"]);
  });
});

describe("isSameOrder", () => {
  it("is true only for the identical sequence", () => {
    expect(isSameOrder(["a", "b"], ["a", "b"])).toBe(true);
    expect(isSameOrder(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("is false when lengths differ", () => {
    expect(isSameOrder(["a"], ["a", "b"])).toBe(false);
  });

  it("treats two empty lists as the same", () => {
    expect(isSameOrder([], [])).toBe(true);
  });
});

describe("isSameMembership", () => {
  // The reorder actions reject a list that is not exactly the current set:
  // a subset would leave the omitted rows holding stale positions, and a
  // foreign id would mean reordering something from another plan.
  it("ignores order", () => {
    expect(isSameMembership(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("rejects a subset", () => {
    expect(isSameMembership(["a", "b", "c"], ["a", "b"])).toBe(false);
  });

  it("rejects an unknown id smuggled in", () => {
    expect(isSameMembership(["a", "b"], ["a", "z"])).toBe(false);
  });

  it("rejects a duplicate padding the length", () => {
    expect(isSameMembership(["a", "b"], ["a", "a"])).toBe(false);
  });
});
