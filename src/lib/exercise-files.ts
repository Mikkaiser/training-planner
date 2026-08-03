/**
 * Shared rules about exercise files. Imported by both the server actions and
 * the client upload UI, so the limit shown in the drop zone, the limit the zod
 * schema enforces, and the limit the database check constraint applies are all
 * the same number.
 *
 * No database or S3 imports here — this file crosses into client bundles.
 */

/** 25 MiB, the ceiling the design's drop zone advertises. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const MAX_FILES_PER_BLOCK = 20;

/**
 * The extension is authoritative, not the browser's content type: the same
 * .md file is reported as text/markdown, text/plain or "" depending on the OS.
 * Each extension maps to the content types we will accept for it, and the
 * first entry is what we fall back to when the browser offers nothing usable.
 *
 * text/html, image/svg+xml and friends are deliberately absent — signing one
 * would let an uploaded file execute as a document on the storage origin.
 */
export const ALLOWED_EXTENSIONS: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  md: ["text/markdown", "text/plain", "text/x-markdown"],
  zip: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
};

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_EXTENSIONS)
  .map((extension) => `.${extension}`)
  .join(",");

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

/** The label shown on the design's file-type chip. */
export function fileKind(fileName: string): string {
  const extension = extensionOf(fileName);
  if (extension === "docx" || extension === "doc") return "DOC";
  return (extension || "FILE").slice(0, 4).toUpperCase();
}

export function isAllowedExtension(fileName: string): boolean {
  return extensionOf(fileName) in ALLOWED_EXTENSIONS;
}

/** Picks the content type to sign: the browser's if we trust it for this
 *  extension, otherwise the canonical one. Never returns something unlisted. */
export function resolveContentType(fileName: string, reported: string): string | null {
  const allowed = ALLOWED_EXTENSIONS[extensionOf(fileName)];
  if (!allowed) return null;
  return allowed.includes(reported) ? reported : allowed[0];
}

/**
 * The trailing, human-readable part of the object key. Aggressive on purpose:
 * a raw filename in a key is how you end up with path traversal, RTL-override
 * characters and signing edge cases.
 */
export function slugifyFileName(fileName: string): string {
  const extension = extensionOf(fileName);
  const stem = fileName.slice(0, fileName.length - (extension ? extension.length + 1 : 0));

  const slug = stem
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase()
    .slice(0, 100);

  const safeStem = slug || "file";
  return extension ? `${safeStem}.${extension}` : safeStem;
}

export const MAX_URL_LENGTH = 2048;
export const MAX_LABEL_LENGTH = 200;

/**
 * Accepts only http and https.
 *
 * The stored URL is rendered as an anchor, so anything else is an injection
 * vector: javascript: executes on click, data: can serve HTML from our own
 * origin's context, and file:/blob: point at the reader's machine. Allowlisting
 * two schemes is the whole control — blocklisting is a losing game once you
 * account for whitespace, casing and unicode tricks in the scheme.
 */
export function normaliseExerciseUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Paste a link first" };
  if (trimmed.length > MAX_URL_LENGTH) return { ok: false, reason: "That link is too long" };

  // A bare "example.com/x" is what people actually paste; assume https rather
  // than rejecting it, but never assume a scheme for anything already carrying
  // one, or "javascript:alert(1)" would become "https://javascript:alert(1)".
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: "That does not look like a link" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https links are allowed" };
  }
  if (!parsed.hostname) return { ok: false, reason: "That link has no address" };

  return { ok: true, url: parsed.toString() };
}

/** A readable default label: the host, with the leading www. dropped. */
export function labelForUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

/**
 * Runs on the client to reject files before uploading and again on the server
 * before signing anything. The client copy is a courtesy; the server copy is
 * the control.
 */
export function validateUploadCandidate(
  fileName: string,
  sizeBytes: number,
  reportedContentType = "",
): { ok: true; contentType: string } | { ok: false; reason: string } {
  const contentType = resolveContentType(fileName, reportedContentType);
  if (!contentType) {
    return { ok: false, reason: "Unsupported format" };
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, reason: "Empty file" };
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    return { ok: false, reason: "Larger than 25 mb" };
  }
  return { ok: true, contentType };
}
