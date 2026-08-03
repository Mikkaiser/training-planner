import { describe, expect, it } from "vitest";
import { cn, formatBytes, getInitials } from "@/lib/utils";

describe("getInitials", () => {
  it("takes the first letter of the first two words", () => {
    expect(getInitials("Eli Vasseur")).toBe("EV");
    expect(getInitials("Sofia Ríos")).toBe("SR");
  });

  it("stops at two even for longer names", () => {
    expect(getInitials("National Squad Cohort B")).toBe("NS");
  });

  it("handles a single name and stray whitespace", () => {
    expect(getInitials("Hana")).toBe("H");
    expect(getInitials("  Mira   Tanaka  ")).toBe("MT");
  });

  it("returns empty rather than throwing on an empty name", () => {
    expect(getInitials("")).toBe("");
  });
});

describe("formatBytes", () => {
  it("matches the design's lowercase units", () => {
    expect(formatBytes(420 * 1024)).toBe("420 kb");
    expect(formatBytes(Math.round(1.2 * 1024 * 1024))).toBe("1.2 mb");
  });

  it("shows whole bytes without a decimal", () => {
    expect(formatBytes(512)).toBe("512 b");
  });

  it("keeps one decimal below ten and drops it above", () => {
    expect(formatBytes(Math.round(8.4 * 1024 * 1024))).toBe("8.4 mb");
    expect(formatBytes(25 * 1024 * 1024)).toBe("25 mb");
  });

  it("does not produce a negative or NaN size", () => {
    expect(formatBytes(0)).toBe("0 b");
    expect(formatBytes(-1)).toBe("0 b");
  });
});

describe("cn", () => {
  it("joins truthy classes and drops falsy ones", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("lets a later tailwind class win over an earlier conflicting one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
