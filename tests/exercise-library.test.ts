/**
 * What counts as "the same exercise", and which copy of it gets reused.
 *
 * Both decisions are silent when wrong. Merging two different briefs that share
 * a file name would attach the wrong material to a competitor's block, and
 * copying from a stale occurrence produces an exercise that looks attached and
 * downloads nothing.
 */
import { describe, expect, it } from "vitest";
import {
  dedupeReusable,
  matchesExerciseQuery,
  searchReusable,
  type LibraryRow,
  type ReusableExercise,
} from "@/lib/exercise-library";

let counter = 0;

function fileRow(overrides: Partial<LibraryRow> = {}): LibraryRow {
  counter += 1;
  return {
    id: `e${counter}`,
    file_name: "brief.pdf",
    kind: "file",
    url: null,
    content_type: "application/pdf",
    size_bytes: 1024,
    created_at: `2026-01-0${counter}T00:00:00.000Z`,
    ...overrides,
  };
}

function linkRow(overrides: Partial<LibraryRow> = {}): LibraryRow {
  return fileRow({
    file_name: "Logic challenges",
    kind: "link",
    url: "https://example.com/logic",
    content_type: null,
    size_bytes: 0,
    ...overrides,
  });
}

describe("dedupeReusable", () => {
  it("collapses the same link wherever it appears, and counts the uses", () => {
    const entries = dedupeReusable([linkRow(), linkRow(), linkRow(), linkRow()]);
    expect(entries).toHaveLength(1);
    expect(entries[0].usageCount).toBe(4);
    expect(entries[0].url).toBe("https://example.com/logic");
  });

  it("collapses a file only when the name and the size both match", () => {
    const same = dedupeReusable([fileRow({ size_bytes: 2048 }), fileRow({ size_bytes: 2048 })]);
    expect(same).toHaveLength(1);
    expect(same[0].usageCount).toBe(2);

    // Two different briefs that happen to share a name — exactly the name
    // people reuse. Merging them would attach the wrong material.
    const different = dedupeReusable([fileRow({ size_bytes: 2048 }), fileRow({ size_bytes: 4096 })]);
    expect(different).toHaveLength(2);
  });

  it("keeps a link and a file apart even when they read the same", () => {
    const entries = dedupeReusable([
      fileRow({ file_name: "brief.pdf", size_bytes: 0 }),
      linkRow({ file_name: "brief.pdf" }),
    ]);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.kind).sort()).toEqual(["file", "link"]);
  });

  it("treats two links with different URLs as different exercises", () => {
    const entries = dedupeReusable([
      linkRow({ url: "https://example.com/one" }),
      linkRow({ url: "https://example.com/two" }),
    ]);
    expect(entries).toHaveLength(2);
  });

  it("copies from the most recent occurrence, whatever order the rows arrive in", () => {
    const older = linkRow({ id: "old", created_at: "2026-01-01T00:00:00.000Z" });
    const newer = linkRow({ id: "new", created_at: "2026-06-01T00:00:00.000Z" });

    expect(dedupeReusable([older, newer])[0].sourceId).toBe("new");
    expect(dedupeReusable([newer, older])[0].sourceId).toBe("new");
  });

  it("takes the label from the most recent occurrence too", () => {
    const entries = dedupeReusable([
      linkRow({ file_name: "Old name", created_at: "2026-01-01T00:00:00.000Z" }),
      linkRow({ file_name: "Current name", created_at: "2026-06-01T00:00:00.000Z" }),
    ]);
    expect(entries[0].label).toBe("Current name");
  });

  it("orders the list with the most recently used first", () => {
    const entries = dedupeReusable([
      linkRow({ url: "https://example.com/a", created_at: "2026-01-01T00:00:00.000Z" }),
      linkRow({ url: "https://example.com/c", created_at: "2026-09-01T00:00:00.000Z" }),
      linkRow({ url: "https://example.com/b", created_at: "2026-05-01T00:00:00.000Z" }),
    ]);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://example.com/c",
      "https://example.com/b",
      "https://example.com/a",
    ]);
  });

  it("returns nothing for an instructor who has attached nothing", () => {
    expect(dedupeReusable([])).toEqual([]);
  });

  it("handles a single exercise", () => {
    const entries = dedupeReusable([linkRow()]);
    expect(entries).toHaveLength(1);
    expect(entries[0].usageCount).toBe(1);
  });
});

describe("matchesExerciseQuery", () => {
  const entry: ReusableExercise = {
    sourceId: "e1",
    kind: "link",
    label: "Logic challenges",
    url: "https://actvet.sharepoint.com/robot-coding.pdf",
    contentType: null,
    sizeBytes: 0,
    usageCount: 2,
    lastUsedAt: "2026-01-01T00:00:00.000Z",
  };

  it("matches the label regardless of case", () => {
    expect(matchesExerciseQuery(entry, "LOGIC")).toBe(true);
    expect(matchesExerciseQuery(entry, "logic")).toBe(true);
  });

  it("matches inside the URL, not only the label", () => {
    // A link is usually recognised by the file name in its path; its label is
    // whatever was typed once and forgotten.
    expect(matchesExerciseQuery(entry, "robot")).toBe(true);
    expect(matchesExerciseQuery(entry, "sharepoint")).toBe(true);
  });

  it("matches part of a word", () => {
    expect(matchesExerciseQuery(entry, "halleng")).toBe(true);
  });

  it("does not match something absent from both", () => {
    expect(matchesExerciseQuery(entry, "database")).toBe(false);
  });

  it("treats an empty or whitespace query as no filter", () => {
    expect(matchesExerciseQuery(entry, "")).toBe(true);
    expect(matchesExerciseQuery(entry, "   ")).toBe(true);
  });

  it("ignores surrounding whitespace in the query", () => {
    expect(matchesExerciseQuery(entry, "  logic  ")).toBe(true);
  });

  it("does not fall over on a file, which has no URL", () => {
    expect(matchesExerciseQuery({ ...entry, kind: "file", url: null }, "logic")).toBe(true);
    expect(matchesExerciseQuery({ ...entry, kind: "file", url: null }, "robot")).toBe(false);
  });
});

describe("searchReusable", () => {
  const entries = dedupeReusable([
    linkRow({ url: "https://example.com/one", file_name: "Alpha" }),
    linkRow({ url: "https://example.com/two", file_name: "Beta" }),
    linkRow({ url: "https://example.com/three", file_name: "Gamma" }),
  ]);

  it("returns everything when the query is empty", () => {
    expect(searchReusable(entries, "", 10)).toHaveLength(3);
  });

  it("filters to the matches", () => {
    expect(searchReusable(entries, "beta", 10).map((entry) => entry.label)).toEqual(["Beta"]);
  });

  it("caps the result count", () => {
    expect(searchReusable(entries, "", 2)).toHaveLength(2);
  });

  it("returns nothing when nothing matches, rather than everything", () => {
    expect(searchReusable(entries, "omega", 10)).toEqual([]);
  });
});
