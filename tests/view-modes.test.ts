/**
 * The view name arrives from a URL and from a non-HttpOnly cookie, so both are
 * attacker-controlled. Everything here is an allowlist; these tests pin that.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_DETAIL_VIEW,
  DEFAULT_LIST_VIEW,
  parseDetailView,
  parseListView,
  viewHref,
} from "@/lib/view-modes";

describe("parseListView", () => {
  it("accepts the known views", () => {
    expect(parseListView("cards")).toBe("cards");
    expect(parseListView("table")).toBe("table");
  });

  it("falls back rather than trusting an arbitrary string", () => {
    for (const hostile of ["../../etc/passwd", "<script>", "route", "", "__proto__"]) {
      expect(parseListView(hostile)).toBe(DEFAULT_LIST_VIEW);
    }
  });

  it("uses the cookie only when no view is in the URL", () => {
    expect(parseListView(undefined, "table")).toBe("table");
    // An explicit param wins, so a shared link shows what it says.
    expect(parseListView("cards", "table")).toBe("cards");
  });

  it("ignores a tampered cookie", () => {
    expect(parseListView(undefined, "timeline")).toBe(DEFAULT_LIST_VIEW);
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseListView(["table", "cards"])).toBe("table");
  });

  it("does not let a detail view leak onto the list page", () => {
    expect(parseListView("tree")).toBe(DEFAULT_LIST_VIEW);
  });
});

describe("parseDetailView", () => {
  it("accepts the three roadmap shapes", () => {
    expect(parseDetailView("timeline")).toBe("timeline");
    expect(parseDetailView("tree")).toBe("tree");
    expect(parseDetailView("route")).toBe("route");
  });

  it("falls back for anything else", () => {
    expect(parseDetailView("cards")).toBe(DEFAULT_DETAIL_VIEW);
    expect(parseDetailView("subway")).toBe(DEFAULT_DETAIL_VIEW);
  });
});

describe("viewHref", () => {
  it("sets the view on a bare path", () => {
    expect(viewHref("/", new URLSearchParams(), "table")).toBe("/?view=table");
  });

  it("replaces an existing view without duplicating it", () => {
    expect(viewHref("/", new URLSearchParams("view=cards"), "table")).toBe("/?view=table");
  });

  it("preserves the other query params, so switching keeps the search", () => {
    const href = viewHref("/", new URLSearchParams("q=eli&gate=pending"), "table");
    const params = new URL(href, "http://x").searchParams;
    expect(params.get("q")).toBe("eli");
    expect(params.get("gate")).toBe("pending");
    expect(params.get("view")).toBe("table");
  });

  it("does not mutate the params it is given", () => {
    const params = new URLSearchParams("view=cards");
    viewHref("/", params, "table");
    expect(params.get("view")).toBe("cards");
  });

  it("keeps a plan path intact", () => {
    expect(viewHref("/plan/abc", new URLSearchParams(), "tree")).toBe("/plan/abc?view=tree");
  });
});
