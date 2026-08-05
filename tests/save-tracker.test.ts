/**
 * Autosaves for one aspect overlap, and nothing guarantees replies arrive in
 * the order the requests left. These tests pin the ordering rule, because the
 * failure it prevents is silent: a marking sheet reporting "saved" for a mark
 * the server rejected, on a screen that decides a competitor's score.
 */
import { describe, expect, it } from "vitest";
import {
  beginSave,
  emptyTracker,
  hasUnsavedWork,
  settleSave,
  summariseSaves,
  type SaveTracker,
} from "@/lib/save-tracker";

/** Starts a save and returns both the tracker and its stamp. */
const start = (tracker: SaveTracker, id: string) => beginSave(tracker, id);

describe("ordering", () => {
  it("ignores a failure that arrives after a newer save has started", () => {
    // The assessor clicks 2, then 3. The first request fails slowly.
    const first = start(emptyTracker, "a");
    const second = start(first.tracker, "a");

    const settled = settleSave(second.tracker, "a", first.seq, false);

    // Still saving on the second attempt — not failed on the first.
    expect(settled.a.state).toBe("saving");
    expect(summariseSaves(settled).failed).toBe(0);
  });

  it("ignores a success that arrives after a newer save has started", () => {
    // The dangerous direction: a stale success must not mark the sheet clean.
    const first = start(emptyTracker, "a");
    const second = start(first.tracker, "a");

    const settled = settleSave(second.tracker, "a", first.seq, true);
    expect(settled.a.state).toBe("saving");
    expect(summariseSaves(settled).allSaved).toBe(false);
  });

  it("accepts the reply for the newest save", () => {
    const first = start(emptyTracker, "a");
    const second = start(first.tracker, "a");

    expect(settleSave(second.tracker, "a", second.seq, true).a.state).toBe("saved");
    expect(settleSave(second.tracker, "a", second.seq, false).a.state).toBe("failed");
  });

  it("hands out an increasing stamp per id, counting each id separately", () => {
    const one = start(emptyTracker, "a");
    const two = start(one.tracker, "a");
    const other = start(two.tracker, "b");

    expect(one.seq).toBe(1);
    expect(two.seq).toBe(2);
    expect(other.seq).toBe(1);
  });

  it("ignores a reply for an id that was never started", () => {
    expect(settleSave(emptyTracker, "ghost", 1, true)).toEqual(emptyTracker);
  });

  it("lets a retry clear an earlier failure", () => {
    const first = start(emptyTracker, "a");
    const failed = settleSave(first.tracker, "a", first.seq, false);
    expect(summariseSaves(failed).failed).toBe(1);

    const retry = start(failed, "a");
    const ok = settleSave(retry.tracker, "a", retry.seq, true);
    expect(summariseSaves(ok).failed).toBe(0);
    expect(summariseSaves(ok).allSaved).toBe(true);
  });
});

describe("summary", () => {
  it("counts what is in flight and what failed, and names the failures", () => {
    let tracker = emptyTracker;
    const a = start(tracker, "a");
    tracker = settleSave(a.tracker, "a", a.seq, false);
    const b = start(tracker, "b");
    tracker = settleSave(b.tracker, "b", b.seq, true);
    const c = start(tracker, "c");
    tracker = c.tracker;

    const summary = summariseSaves(tracker);
    expect(summary.saving).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.failedIds).toEqual(["a"]);
    expect(summary.allSaved).toBe(false);
  });

  it("is not 'all saved' before anything has been saved", () => {
    // Otherwise an untouched sheet claims its marks are safely stored.
    expect(summariseSaves(emptyTracker).allSaved).toBe(false);
  });

  it("is 'all saved' only once nothing is outstanding", () => {
    const a = start(emptyTracker, "a");
    expect(summariseSaves(a.tracker).allSaved).toBe(false);
    expect(summariseSaves(settleSave(a.tracker, "a", a.seq, true)).allSaved).toBe(true);
  });
});

describe("hasUnsavedWork", () => {
  it("counts a debounced keystroke that has not been sent yet", () => {
    // The comment box waits 600ms. Closing the tab inside that window loses it.
    expect(hasUnsavedWork(emptyTracker, 1)).toBe(true);
    expect(hasUnsavedWork(emptyTracker, 0)).toBe(false);
  });

  it("counts a save in flight and a save that failed", () => {
    const a = start(emptyTracker, "a");
    expect(hasUnsavedWork(a.tracker, 0)).toBe(true);

    const failed = settleSave(a.tracker, "a", a.seq, false);
    expect(hasUnsavedWork(failed, 0)).toBe(true);

    const saved = settleSave(a.tracker, "a", a.seq, true);
    expect(hasUnsavedWork(saved, 0)).toBe(false);
  });
});
