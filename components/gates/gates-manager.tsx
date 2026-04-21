"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/shared/glass-card";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { FileIcon } from "@/components/shared/FileIcon";
import { FileUpload } from "@/components/shared/FileUpload";
import { GatesSkeleton } from "@/components/shared/skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteFile,
  type AllowedFileType,
  type UploadResult,
} from "@/lib/storage/storage";

type Phase = {
  id: string;
  name: string;
  order_index: number | null;
};

type Gate = {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  gate_type: "block_gate" | "phase_gate";
  pass_threshold: number | null;
};

type Assessment = {
  id: string;
  gate_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
};

type GatesData = {
  phases: Phase[];
  gatesByPhase: Map<string, Gate[]>;
  assessmentsByGate: Map<string, Assessment[]>;
};

const GATES_QUERY_KEY = ["dashboard-gates"] as const;

async function fetchGatesData(): Promise<GatesData> {
  const supabase = getSupabaseBrowserClient();
  const [phasesRes, gatesRes, assessmentsRes] = await Promise.all([
    supabase
      .from("phases")
      .select("id,name,order_index")
      .order("order_index", { ascending: true, nullsFirst: false }),
    supabase
      .from("gates")
      .select("id,phase_id,name,description,gate_type,pass_threshold")
      .order("gate_type", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("gate_assessments")
      .select("id,gate_id,title,description,file_url,file_name,file_type")
      .order("title", { ascending: true }),
  ]);

  if (phasesRes.error) throw phasesRes.error;
  if (gatesRes.error) throw gatesRes.error;
  if (assessmentsRes.error) throw assessmentsRes.error;

  const gatesByPhase = new Map<string, Gate[]>();
  for (const g of (gatesRes.data ?? []) as Gate[]) {
    const list = gatesByPhase.get(g.phase_id) ?? [];
    list.push(g);
    gatesByPhase.set(g.phase_id, list);
  }

  const assessmentsByGate = new Map<string, Assessment[]>();
  for (const a of (assessmentsRes.data ?? []) as Assessment[]) {
    const list = assessmentsByGate.get(a.gate_id) ?? [];
    list.push(a);
    assessmentsByGate.set(a.gate_id, list);
  }

  return {
    phases: (phasesRes.data ?? []) as Phase[],
    gatesByPhase,
    assessmentsByGate,
  };
}

export function GatesManager() {
  const { data, isLoading, error } = useQuery({
    queryKey: GATES_QUERY_KEY,
    queryFn: fetchGatesData,
    staleTime: 30_000,
  });

  if (isLoading) {
    return <GatesSkeleton />;
  }

  if (error) {
    return (
      <GlassCard>
        <div className="text-sm text-negative">
          Could not load gates. Please try again.
        </div>
      </GlassCard>
    );
  }

  if (!data || data.phases.length === 0) {
    return (
      <GlassCard>
        <div className="text-sm text-tp-secondary">
          No phases yet. Add phases before uploading gate assessments.
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-[24px]">
      {data.phases.map((phase) => {
        const gates = data.gatesByPhase.get(phase.id) ?? [];
        return (
          <PhaseGatesCard
            key={phase.id}
            phase={phase}
            gates={gates}
            assessmentsByGate={data.assessmentsByGate}
          />
        );
      })}
    </div>
  );
}

function PhaseGatesCard({
  phase,
  gates,
  assessmentsByGate,
}: {
  phase: Phase;
  gates: Gate[];
  assessmentsByGate: Map<string, Assessment[]>;
}) {
  return (
    <GlassCard>
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
        <h2 className="text-base font-semibold text-tp-primary">{phase.name}</h2>
        <span className="text-xs text-tp-muted">
          {gates.length} gate{gates.length === 1 ? "" : "s"}
        </span>
      </div>
      {gates.length === 0 ? (
        <p className="mt-3 text-sm text-tp-secondary">
          No gates defined for this phase yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {gates.map((gate) => (
            <GateRow
              key={gate.id}
              gate={gate}
              assessments={assessmentsByGate.get(gate.id) ?? []}
            />
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

function GateRow({
  gate,
  assessments,
}: {
  gate: Gate;
  assessments: Assessment[];
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = gate.gate_type === "phase_gate" ? ShieldCheck : Shield;

  return (
    <li className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={16} className="text-tp-muted" aria-hidden />
        ) : (
          <ChevronRight size={16} className="text-tp-muted" aria-hidden />
        )}
        <Icon size={16} className="text-tp-secondary" aria-hidden />
        <span className="flex-1 text-sm font-medium text-tp-primary">
          {gate.name}
        </span>
        <span className="text-xs text-tp-muted">
          {gate.gate_type === "phase_gate" ? "Phase gate" : "Block gate"}
        </span>
        {typeof gate.pass_threshold === "number" ? (
          <span
            className="rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{
              background: "var(--color-accent-muted)",
              borderColor: "color-mix(in srgb, var(--color-accent) 25%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            {gate.pass_threshold}%
          </span>
        ) : null}
        <span className="text-xs text-tp-muted">
          {assessments.length} document{assessments.length === 1 ? "" : "s"}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 pl-6">
          {gate.description ? (
            <p className="text-sm text-tp-secondary">{gate.description}</p>
          ) : null}

          <AssessmentList assessments={assessments} />
          <AssessmentUploader gateId={gate.id} />
        </div>
      ) : null}
    </li>
  );
}

function AssessmentList({ assessments }: { assessments: Assessment[] }) {
  if (assessments.length === 0) {
    return (
      <p className="text-sm text-tp-muted">No assessment documents yet.</p>
    );
  }
  return (
    <ul className="space-y-2">
      {assessments.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2"
        >
          <FileIcon type={a.file_type} size={16} />
          <div className="flex-1">
            <div className="text-sm font-medium text-tp-primary">
              {a.title}
            </div>
            {a.description ? (
              <div className="text-xs text-tp-muted">{a.description}</div>
            ) : null}
          </div>
          {a.file_url && a.file_name ? (
            <DownloadButton
              bucket="gate-assessments"
              filePath={a.file_url}
              fileName={a.file_name}
              fileType={(a.file_type as AllowedFileType) || "pdf"}
              variant="button"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AssessmentUploader({ gateId }: { gateId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setUploaded(null);
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  const removeUploaded = async () => {
    if (!uploaded) return;
    const path = uploaded.path;
    setUploaded(null);
    try {
      await deleteFile("gate-assessments", path);
    } catch (err) {
      if (err instanceof Error) {
        console.error("[Storage error] remove assessment", err.message);
      }
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!uploaded) throw new Error("Upload a document first.");
      if (!title.trim()) throw new Error("Title is required.");

      const supabase = getSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;

      const { error: insertErr } = await supabase
        .from("gate_assessments")
        .insert({
          gate_id: gateId,
          title: title.trim(),
          description: description.trim() || null,
          file_url: uploaded.path,
          file_name: uploaded.fileName,
          file_type: uploaded.fileType,
          created_by: uid,
        });

      if (insertErr) {
        await deleteFile("gate-assessments", uploaded.path).catch(() => {});
        console.error("[Gate assessment insert]", insertErr.message);
        throw new Error("Could not save assessment. Please try again.");
      }
    },
    onSuccess: () => {
      toast.success("Assessment uploaded");
      queryClient.invalidateQueries({ queryKey: GATES_QUERY_KEY });
      reset();
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Could not save assessment.";
      toast.error(msg);
    },
  });

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="hover-tint inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-accent-muted)] px-3 py-1.5 text-sm font-medium text-tp-primary transition"
      >
        <Plus size={14} />
        <span>Add assessment</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      {!uploaded ? (
        <FileUpload
          bucket="gate-assessments"
          folder={`gates/${gateId}`}
          label="Upload gate assessment document"
          onUploadComplete={setUploaded}
          disabled={mutation.isPending}
        />
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
          <FileIcon type={uploaded.fileType} size={16} />
          <span className="flex-1 truncate text-sm text-tp-primary">
            {uploaded.fileName}
          </span>
          <button
            type="button"
            onClick={removeUploaded}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-tp-muted hover:text-tp-primary"
            disabled={mutation.isPending}
            aria-label="Remove uploaded file"
          >
            <X size={12} />
            <span>Remove</span>
          </button>
        </div>
      )}

      <div>
        <Label htmlFor={`ga-title-${gateId}`}>Title</Label>
        <Input
          id={`ga-title-${gateId}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Foundation Gate rubric"
        />
      </div>

      <div>
        <Label htmlFor={`ga-desc-${gateId}`}>Description</Label>
        <textarea
          id={`ga-desc-${gateId}`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass-input w-full rounded-lg px-2.5 py-1.5 text-sm outline-none"
          placeholder="Optional notes for instructors..."
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-3 py-1.5 text-sm text-tp-secondary transition hover:text-tp-primary"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending || !uploaded || !title.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileText size={14} />
          <span>{mutation.isPending ? "Saving…" : "Save assessment"}</span>
        </button>
      </div>
    </form>
  );
}

export { GATES_QUERY_KEY };
