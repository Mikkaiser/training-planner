"use client";

import { useCallback, useRef, useState } from "react";
import { confirmExerciseUpload, deleteExercise, presignExerciseUpload } from "@/actions/exercises";
import { validateUploadCandidate } from "@/lib/exercise-files";

export type QueueState = "queued" | "uploading" | "verifying" | "done" | "error";

export type QueueItem = {
  key: string;
  file: File;
  name: string;
  size: number;
  pct: number;
  state: QueueState;
  error?: string;
  exerciseId?: string;
};

/** Enough to keep a link busy without starving the interface. */
const MAX_CONCURRENT = 3;

/**
 * Drives browser -> MinIO uploads.
 *
 * XMLHttpRequest rather than fetch: only XHR reports upload progress, and the
 * design's queue shows a live percentage per file. fetch still has no
 * cross-browser equivalent, and abort() gives us cancel for free.
 */
export function useExerciseUpload(planId: string, blockId: string, onCommitted: () => void) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const counter = useRef(0);

  const patch = useCallback((key: string, changes: Partial<QueueItem>) => {
    setQueue((items) => items.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  }, []);

  const uploadOne = useCallback(
    async (item: QueueItem) => {
      try {
        patch(item.key, { state: "uploading", pct: 0 });

        const { exerciseId, uploadUrl, contentType } = await presignExerciseUpload({
          planId,
          blockId,
          fileName: item.name,
          sizeBytes: item.size,
          contentType: item.file.type,
        });

        patch(item.key, { exerciseId });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          requests.current.set(item.key, xhr);

          xhr.open("PUT", uploadUrl, true);
          // Exactly the header that was signed. Any extra or differing header
          // invalidates the signature and MinIO answers 403.
          xhr.setRequestHeader("Content-Type", contentType);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              patch(item.key, { pct: Math.round((event.loaded / event.total) * 100) });
            }
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Storage rejected the upload (${xhr.status})`));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Cancelled"));
          xhr.send(item.file);
        });

        // The row only becomes visible once the server has checked the object
        // really landed at the size we signed for.
        patch(item.key, { state: "verifying", pct: 100 });
        await confirmExerciseUpload({ planId, exerciseId });
        patch(item.key, { state: "done" });
        onCommitted();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";

        // Drop the reserved row so a failed attempt leaves nothing behind.
        if (item.exerciseId) {
          await deleteExercise({ planId, exerciseId: item.exerciseId }).catch(() => undefined);
        }
        patch(item.key, { state: "error", error: message, exerciseId: undefined });
      } finally {
        requests.current.delete(item.key);
      }
    },
    [blockId, onCommitted, patch, planId],
  );

  const enqueue = useCallback(
    (files: File[]) => {
      const accepted: QueueItem[] = [];

      for (const file of files) {
        counter.current += 1;
        const key = `f${counter.current}`;
        const check = validateUploadCandidate(file.name, file.size, file.type);

        accepted.push({
          key,
          file,
          name: file.name,
          size: file.size,
          pct: 0,
          state: check.ok ? "queued" : "error",
          error: check.ok ? undefined : check.reason,
        });
      }

      setQueue((items) => [...items, ...accepted]);

      // Run the valid ones with a small concurrency window.
      const runnable = accepted.filter((item) => item.state === "queued");
      let cursor = 0;
      const pump = async (): Promise<void> => {
        while (cursor < runnable.length) {
          const next = runnable[cursor];
          cursor += 1;
          await uploadOne(next);
        }
      };
      void Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, runnable.length) }, pump));
    },
    [uploadOne],
  );

  const cancel = useCallback((key: string) => {
    requests.current.get(key)?.abort();
  }, []);

  const retry = useCallback(
    (key: string) => {
      setQueue((items) => {
        const item = items.find((entry) => entry.key === key);
        if (item) void uploadOne({ ...item, state: "queued", error: undefined, pct: 0 });
        return items;
      });
    },
    [uploadOne],
  );

  const clearFinished = useCallback(() => {
    setQueue((items) => items.filter((item) => item.state !== "done"));
  }, []);

  return { queue, enqueue, cancel, retry, clearFinished };
}
