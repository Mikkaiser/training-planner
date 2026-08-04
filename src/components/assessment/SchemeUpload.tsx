"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importScheme } from "@/actions/assessments";
import { UploadIcon } from "@/components/ui/icons";
import { assessmentSchemeRoute } from "@/lib/routes";

/**
 * Drop zone for a CIS marking scheme. Mirrors the exercise upload panel's
 * shape, but the file goes through a server action rather than a presigned PUT
 * — the server has to read these bytes to parse them anyway.
 */
export function SchemeUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const submit = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setWarnings([]);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      try {
        const result = await importScheme(formData);
        setWarnings(result.warnings);
        // Warnings are worth reading before moving on; a clean import is not.
        if (result.warnings.length === 0) router.push(assessmentSchemeRoute(result.schemeId));
        else router.refresh();
      } catch (importError) {
        setError(importError instanceof Error ? importError.message : "Could not read that workbook.");
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          submit(event.dataTransfer.files[0]);
        }}
        style={{
          width: "100%",
          border: `1.5px dashed ${dragging ? "var(--ink)" : "var(--accent)"}`,
          background: dragging ? "var(--accent-soft-2)" : "var(--accent-soft)",
          borderRadius: 14,
          padding: "26px 20px",
          textAlign: "center",
          cursor: pending ? "progress" : "pointer",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "white",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 12px",
            color: "var(--ink)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <UploadIcon size={16} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {pending ? "Reading the workbook…" : "Drop a marking scheme here"}
        </div>
        <div className="tp-tiny tp-mut tp-mt-1">
          or{" "}
          <span style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
            browse your computer
          </span>
        </div>
        <div className="tp-tiny tp-mono tp-mut tp-mt-3" style={{ letterSpacing: "0.04em" }}>
          CIS Marking Scheme Import · .xlsx
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        hidden
        onChange={(event) => {
          submit(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {error ? (
        <div
          className="tp-mt-3"
          style={{
            padding: "12px 14px",
            background: "var(--neg-soft)",
            border: "1px solid rgba(251,54,64,0.25)",
            borderRadius: 10,
            fontSize: 12.5,
            color: "var(--neg)",
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div
          className="tp-mt-3"
          style={{
            padding: "12px 14px",
            background: "var(--surface-2)",
            border: "1px dashed var(--border-strong)",
            borderRadius: 10,
          }}
        >
          <div className="tp-eyebrow" style={{ marginBottom: 6 }}>
            Imported with {warnings.length} warning{warnings.length === 1 ? "" : "s"}
          </div>
          {warnings.map((warning) => (
            <div key={warning} className="tp-tiny tp-mut">
              {warning}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
