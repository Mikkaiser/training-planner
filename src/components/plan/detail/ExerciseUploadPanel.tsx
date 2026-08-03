"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Tag } from "@/components/ui/Tag";
import { CheckIcon, CrossIcon, UploadIcon } from "@/components/ui/icons";
import { useExerciseUpload, type QueueItem } from "@/hooks/useExerciseUpload";
import { ACCEPT_ATTRIBUTE, fileKind } from "@/lib/exercise-files";
import type { BlockVM } from "@/lib/plan-view-model";
import { formatBytes } from "@/lib/utils";

interface ExerciseUploadPanelProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  phaseLabel: string;
  block: BlockVM;
}

/** Design artboard: "Add exercises · uploading". */
export function ExerciseUploadPanel({ open, onClose, planId, phaseLabel, block }: ExerciseUploadPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const { queue, enqueue, cancel, retry } = useExerciseUpload(planId, block.id, () => router.refresh());

  const done = queue.filter((item) => item.state === "done").length;
  const busy = queue.filter((item) => item.state === "uploading" || item.state === "verifying").length;

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Add exercises to ${block.title}`} width={560}>
      <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid var(--border)" }}>
        <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div className="tp-col" style={{ gap: 6 }}>
            <div className="tp-eyebrow">{phaseLabel}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Add exercises</div>
            <div className="tp-row tp-gap-2 tp-mt-1" style={{ flexWrap: "wrap" }}>
              <Tag type={block.competenceType} />
              <span className="tp-sm" style={{ fontWeight: 600 }}>
                {block.title}
              </span>
              <span className="tp-pill tp-pill-mono">{block.verbLevel}</span>
            </div>
          </div>
          <button
            type="button"
            className="tp-btn tp-btn-ghost tp-btn-sm"
            style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
            onClick={onClose}
            aria-label="Close"
          >
            <CrossIcon size={12} />
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px 0" }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            enqueue(Array.from(event.dataTransfer.files));
          }}
          style={{
            width: "100%",
            border: `1.5px dashed ${dragging ? "var(--ink)" : "var(--accent)"}`,
            background: dragging ? "var(--accent-soft-2)" : "var(--accent-soft)",
            borderRadius: 14,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "background .15s, border-color .15s",
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
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>Drop files here</div>
          <div className="tp-tiny tp-mut tp-mt-1">
            or{" "}
            <span style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 }}>
              browse your computer
            </span>
          </div>
          <div className="tp-tiny tp-mono tp-mut tp-mt-3" style={{ letterSpacing: "0.04em" }}>
            PDF · DOCX · MD · ZIP · max 25 mb each
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          hidden
          onChange={(event) => {
            enqueue(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 ? (
        <div style={{ padding: "18px 24px 0" }}>
          <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div className="tp-eyebrow">Queue · {queue.length} files</div>
            <div className="tp-tiny tp-mut">
              {done} attached{busy ? ` · ${busy} uploading` : ""}
            </div>
          </div>
          <div className="tp-col tp-gap-2">
            {queue.map((item) => (
              <UploadRow key={item.key} item={item} onCancel={() => cancel(item.key)} onRetry={() => retry(item.key)} />
            ))}
          </div>
        </div>
      ) : null}

      <div
        style={{
          padding: "18px 24px 20px",
          marginTop: 18,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="tp-tiny tp-mut">Files attach to this block only.</div>
        <button type="button" className="tp-btn tp-btn-primary" onClick={onClose} disabled={busy > 0}>
          {busy > 0 ? `Uploading ${busy}…` : "Done"}
        </button>
      </div>
    </Modal>
  );
}

function UploadRow({ item, onCancel, onRetry }: { item: QueueItem; onCancel: () => void; onRetry: () => void }) {
  const isError = item.state === "error";
  const isDone = item.state === "done";
  const isVerifying = item.state === "verifying";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: isError ? "var(--neg-soft)" : "var(--surface)",
        border: `1px solid ${isError ? "rgba(251,54,64,0.25)" : "var(--border)"}`,
        borderRadius: 10,
      }}
    >
      <div
        className="tp-file-icon"
        style={{ borderColor: isError ? "rgba(251,54,64,0.3)" : "var(--border-strong)" }}
      >
        {fileKind(item.name)}
      </div>

      <div className="tp-col" style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <div className="tp-row" style={{ justifyContent: "space-between", gap: 10 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 12.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </div>
          <div className="tp-tiny tp-mono tp-mut" style={{ flexShrink: 0 }}>
            {isError ? item.error : isDone ? formatBytes(item.size) : isVerifying ? "checking" : `${item.pct}%`}
          </div>
        </div>

        {!isDone && !isError ? (
          <div className="tp-bar" style={{ height: 4 }}>
            <i style={{ width: `${item.pct}%` }} />
          </div>
        ) : null}
        {isDone ? <div className="tp-tiny tp-mut">Attached</div> : null}
        {isError ? (
          <div className="tp-tiny" style={{ color: "var(--neg)" }}>
            {item.error === "Unsupported format" ? "Convert to PDF and retry" : "Nothing was saved"}
          </div>
        ) : null}
      </div>

      {isDone ? <div style={{ color: "var(--pos)" }}>{<CheckIcon size={13} />}</div> : null}
      {isError ? (
        <button type="button" className="tp-btn tp-btn-ghost tp-btn-sm" style={{ padding: "4px 10px" }} onClick={onRetry}>
          Retry
        </button>
      ) : null}
      {!isDone && !isError ? (
        <button
          type="button"
          className="tp-btn tp-btn-ghost tp-btn-sm"
          style={{ padding: "4px 7px", borderColor: "transparent", color: "var(--ink-2)" }}
          onClick={onCancel}
          aria-label={`Cancel ${item.name}`}
        >
          <CrossIcon size={11} />
        </button>
      ) : null}
    </div>
  );
}
