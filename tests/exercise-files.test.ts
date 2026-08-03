/**
 * These rules decide what is allowed into the bucket and what the object key
 * looks like, so they are a security boundary as much as a formatting concern.
 */
import { describe, expect, it } from "vitest";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_BYTES,
  MAX_URL_LENGTH,
  extensionOf,
  fileKind,
  isAllowedExtension,
  labelForUrl,
  normaliseExerciseUrl,
  resolveContentType,
  slugifyFileName,
  validateUploadCandidate,
} from "@/lib/exercise-files";

describe("MAX_FILE_BYTES", () => {
  it("is the 25 MiB the drop zone advertises and the DB check enforces", () => {
    expect(MAX_FILE_BYTES).toBe(26_214_400);
  });
});

describe("extensionOf / fileKind", () => {
  it("reads the last extension, case-insensitively", () => {
    expect(extensionOf("Brief.PDF")).toBe("pdf");
    expect(extensionOf("archive.tar.gz")).toBe("gz");
  });

  it("returns nothing for a file with no extension", () => {
    expect(extensionOf("README")).toBe("");
  });

  it("labels both Word extensions DOC, as the design's chip does", () => {
    expect(fileKind("notes.docx")).toBe("DOC");
    expect(fileKind("notes.doc")).toBe("DOC");
    expect(fileKind("spec.pdf")).toBe("PDF");
    expect(fileKind("lab.zip")).toBe("ZIP");
  });

  it("falls back to a label rather than showing an empty chip", () => {
    expect(fileKind("README")).toBe("FILE");
  });
});

describe("isAllowedExtension", () => {
  it("accepts the formats the design lists", () => {
    for (const name of ["a.pdf", "a.doc", "a.docx", "a.md", "a.zip"]) {
      expect(isAllowedExtension(name)).toBe(true);
    }
  });

  it("rejects executable and markup formats", () => {
    // Signing text/html or svg would let an upload run as a document on the
    // storage origin.
    for (const name of ["page.html", "icon.svg", "run.sh", "app.exe", "photo.png", "noext"]) {
      expect(isAllowedExtension(name)).toBe(false);
    }
  });

  it("is not fooled by an allowed extension appearing mid-name", () => {
    expect(isAllowedExtension("invoice.pdf.exe")).toBe(false);
  });
});

describe("resolveContentType", () => {
  it("keeps the browser's type when it is plausible for the extension", () => {
    expect(resolveContentType("a.pdf", "application/pdf")).toBe("application/pdf");
    expect(resolveContentType("a.md", "text/plain")).toBe("text/plain");
  });

  it("substitutes the canonical type when the browser reports nothing useful", () => {
    // Markdown in particular is reported as text/markdown, text/plain or ""
    // depending on the operating system.
    expect(resolveContentType("a.md", "")).toBe("text/markdown");
    expect(resolveContentType("a.pdf", "application/octet-stream")).toBe("application/pdf");
  });

  it("never echoes back a dangerous type the client claims", () => {
    expect(resolveContentType("a.pdf", "text/html")).toBe("application/pdf");
  });

  it("returns null for an extension that is not allowed at all", () => {
    expect(resolveContentType("page.html", "text/html")).toBeNull();
  });
});

describe("slugifyFileName", () => {
  it("keeps a already-safe name intact", () => {
    expect(slugifyFileName("rest-pagination-spec.pdf")).toBe("rest-pagination-spec.pdf");
  });

  it("lowercases and collapses whitespace and punctuation", () => {
    expect(slugifyFileName("My Notes (v2).pdf")).toBe("my-notes-v2.pdf");
  });

  it("strips path traversal", () => {
    const slug = slugifyFileName("../../etc/passwd.pdf");
    expect(slug).not.toContain("/");
    expect(slug).not.toContain("..");
    expect(slug.endsWith(".pdf")).toBe(true);
  });

  it("removes control and direction-override characters", () => {
    const slug = slugifyFileName("evil‮gnp.pdf");
    expect(slug).not.toContain("‮");
  });

  it("preserves the extension while capping the stem", () => {
    const slug = slugifyFileName(`${"a".repeat(300)}.pdf`);
    expect(slug.endsWith(".pdf")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(104);
  });

  it("still yields a usable name when everything is stripped", () => {
    expect(slugifyFileName("???.pdf")).toBe("file.pdf");
  });
});

describe("validateUploadCandidate", () => {
  it("accepts a normal file and resolves its type", () => {
    const result = validateUploadCandidate("spec.pdf", 1024, "application/pdf");
    expect(result).toEqual({ ok: true, contentType: "application/pdf" });
  });

  it("rejects an unsupported format", () => {
    expect(validateUploadCandidate("page.html", 1024, "text/html")).toEqual({
      ok: false,
      reason: "Unsupported format",
    });
  });

  it("rejects an empty file", () => {
    expect(validateUploadCandidate("spec.pdf", 0)).toEqual({ ok: false, reason: "Empty file" });
  });

  it("accepts exactly the limit and rejects one byte over", () => {
    expect(validateUploadCandidate("spec.pdf", MAX_FILE_BYTES).ok).toBe(true);
    expect(validateUploadCandidate("spec.pdf", MAX_FILE_BYTES + 1)).toEqual({
      ok: false,
      reason: "Larger than 25 mb",
    });
  });

  it("rejects a non-integer size rather than passing it to the signer", () => {
    expect(validateUploadCandidate("spec.pdf", 10.5).ok).toBe(false);
  });
});

describe("normaliseExerciseUrl", () => {
  it("accepts http and https", () => {
    expect(normaliseExerciseUrl("https://example.com/a")).toEqual({ ok: true, url: "https://example.com/a" });
    expect(normaliseExerciseUrl("http://example.com/a")).toEqual({ ok: true, url: "http://example.com/a" });
  });

  it("assumes https for a bare host, which is what people paste", () => {
    expect(normaliseExerciseUrl("example.com/exercise")).toEqual({ ok: true, url: "https://example.com/exercise" });
  });

  it("trims surrounding whitespace", () => {
    expect(normaliseExerciseUrl("  https://example.com  ")).toEqual({ ok: true, url: "https://example.com/" });
  });

  // The stored value is rendered as an anchor, so the scheme allowlist is the
  // control that stops an attachment from executing when someone clicks it.
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://example.com/abc",
  ])("rejects %s", (hostile) => {
    const result = normaliseExerciseUrl(hostile);
    expect(result.ok).toBe(false);
  });

  it("does not turn a dangerous scheme into a valid host by prefixing https", () => {
    // The guard is that anything already carrying a scheme is left alone;
    // otherwise "javascript:alert(1)" would become a plausible https URL.
    const result = normaliseExerciseUrl("javascript:alert(1)");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("http");
  });

  it("rejects empty input", () => {
    expect(normaliseExerciseUrl("   ").ok).toBe(false);
  });

  it("rejects a link past the length cap", () => {
    expect(normaliseExerciseUrl(`https://example.com/${"a".repeat(MAX_URL_LENGTH)}`).ok).toBe(false);
  });

  it("rejects something that is not a URL at all", () => {
    expect(normaliseExerciseUrl("https://").ok).toBe(false);
  });

  it("keeps the query string and fragment intact", () => {
    const result = normaliseExerciseUrl("https://example.com/a?b=1#c");
    expect(result.ok && result.url).toBe("https://example.com/a?b=1#c");
  });
});

describe("labelForUrl", () => {
  it("uses the host without www", () => {
    expect(labelForUrl("https://www.example.com/deep/path")).toBe("example.com");
    expect(labelForUrl("https://docs.example.co.uk/x")).toBe("docs.example.co.uk");
  });

  it("falls back rather than throwing on nonsense", () => {
    expect(labelForUrl("not a url")).toBe("Link");
  });
});

describe("ACCEPT_ATTRIBUTE", () => {
  it("lists every allowed extension for the file picker", () => {
    expect(ACCEPT_ATTRIBUTE.split(",").sort()).toEqual([".doc", ".docx", ".md", ".pdf", ".zip"]);
  });
});
