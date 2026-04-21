"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PLAN_COLORS, type PlanColorKey } from "@/lib/constants/planColors";
import type {
  Block,
  Gate,
  Phase,
  Subcompetence,
} from "@/lib/training-plans/types";

const gateSchema = z.object({
  name: z.string().min(1, "Gate name is required."),
  gate_type: z.enum(["block_gate", "phase_gate"]),
  pass_threshold: z.coerce.number().min(0).max(100).nullable(),
});

const blockSchema = z.object({
  name: z.string().min(1, "Block name is required."),
  subcompetence_id: z.string().nullable(),
});

const createPhaseSchema = z.object({
  name: z.string().min(1, "Phase name is required."),
  duration_weeks: z.coerce.number().int().min(1, "Duration is required."),
  subcompetence_ids: z.array(z.string()).min(1, "Pick at least one subcompetence."),
  blocks: z.array(blockSchema).default([]),
  gates: z.array(gateSchema).default([]),
  newSubcompetence: z
    .object({
      enabled: z.boolean().default(false),
      name: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    })
    .default({ enabled: false }),
});

type CreatePhaseValues = z.infer<typeof createPhaseSchema>;

function chipStyle(color: string | null | undefined) {
  if (!color) return {};
  const c = String(color).trim();
  const lc = c.toLowerCase();

  // Default: CSS handles bg/border via color-mix(); we only provide overrides for known problematic colors.
  const style: Record<string, string> = { ["--subcompetence-color"]: c };

  // In dark mode we want full-color text with subtle tint only (no light-mode overrides).
  if (typeof document !== "undefined") {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) return style as React.CSSProperties;
  }

  // Analysis & Design (#7C6AF7)
  if (lc === "#7c6af7") {
    style["--subcompetence-bg"] = "rgba(124,106,247,0.14)";
    style["--subcompetence-border"] = "rgba(124,106,247,0.45)";
    style["--subcompetence-fg"] = "#5b47e0";
  }

  // Development (#DBFD6B) — too light in light mode, darken fg/bg/border
  if (lc === "#dbfd6b") {
    style["--subcompetence-bg"] = "rgba(150,180,0,0.12)";
    style["--subcompetence-border"] = "rgba(150,180,0,0.40)";
    style["--subcompetence-fg"] = "#5a6e00";
  }

  // Testing (#00a878)
  if (lc === "#00a878") {
    style["--subcompetence-bg"] = "rgba(0,168,120,0.12)";
    style["--subcompetence-border"] = "rgba(0,168,120,0.40)";
    style["--subcompetence-fg"] = "#007a58";
  }

  // Transversal (#FB923C)
  if (lc === "#fb923c") {
    style["--subcompetence-bg"] = "rgba(251,146,60,0.12)";
    style["--subcompetence-border"] = "rgba(251,146,60,0.40)";
    style["--subcompetence-fg"] = "#c45e00";
  }

  return style as React.CSSProperties;
}

export function PhasePickerPopover({
  existingPhases,
  existingDisabledIds,
  subcompetences,
  onAddExisting,
  onCreated,
  createdBy,
  planPhaseCount,
  triggerClassName,
  planColor = "blue",
}: {
  existingPhases: Phase[];
  existingDisabledIds: Set<string>;
  subcompetences: Subcompetence[];
  onAddExisting: (phase: Phase) => Promise<void> | void;
  onCreated: (phase: Phase) => Promise<void> | void;
  createdBy: string;
  planPhaseCount: number;
  triggerClassName?: string;
  /** Active plan color — used to tint phase cards inside the popover. */
  planColor?: PlanColorKey;
}) {
  const planTokens = PLAN_COLORS[planColor];
  const popoverTintStyle: React.CSSProperties = {
    ["--plan-tint" as string]: planTokens.bg,
    ["--plan-tint-strong" as string]: planTokens.bgStrong,
    ["--plan-chip-border" as string]: planTokens.chipBorder,
    ["--plan-border" as string]: planTokens.border,
    ["--plan-accent" as string]: planTokens.accent,
    ["--plan-glow" as string]: planTokens.glow,
  };
  // Only the color tokens are passed as inline style; base/hover surface colors
  // come from the `.tp-phase-picker-existing-card` rule in globals.css, which is
  // dark-mode aware.
  const existingCardStyle: React.CSSProperties = {
    borderColor: planTokens.chipBorder,
    borderLeft: `3px solid ${planTokens.border}`,
  };
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [tab, setTab] = useState<"existing" | "create">("existing");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const form = useForm<CreatePhaseValues>({
    resolver: zodResolver(createPhaseSchema) as unknown as Resolver<CreatePhaseValues>,
    defaultValues: {
      name: "",
      duration_weeks: 4,
      subcompetence_ids: [],
      blocks: [{ name: "Block 1", subcompetence_id: null }],
      gates: [],
      newSubcompetence: {
        enabled: false,
        name: "",
        color: "var(--color-text-accent)",
        icon: "dot",
      },
    },
    mode: "onChange",
  });

  const { fields: blockFields, append: addBlock, remove: removeBlock } = useFieldArray({
    control: form.control,
    name: "blocks",
  });
  const { fields: gateFields, append: addGate, remove: removeGate } = useFieldArray({
    control: form.control,
    name: "gates",
  });

  const values = form.watch();
  const newSc =
    values.newSubcompetence ?? ({
      enabled: false,
      name: "",
      color: "var(--color-text-accent)",
      icon: "dot",
    } as const);

  const filtered = existingPhases.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function createAndAdd() {
    setCreating(true);
    try {
      const parsed = createPhaseSchema.parse(form.getValues());

      let scIds = parsed.subcompetence_ids.slice();

      // Optional inline new subcompetence
      if (parsed.newSubcompetence.enabled) {
        const name = (parsed.newSubcompetence.name ?? "").trim();
        const color = parsed.newSubcompetence.color ?? "var(--color-text-accent)";
        const icon = parsed.newSubcompetence.icon ?? "dot";
        if (name.length >= 2) {
          const { data, error } = await supabase
            .from("subcompetences")
            .insert({
              name,
              description: null,
              color,
              icon,
              created_by: createdBy,
            })
            .select("id,name,description,color,icon")
            .single();
          if (error) throw error;
          scIds = [data.id as string, ...scIds];
        }
      }

      const { data: phaseRow, error: phaseErr } = await supabase
        .from("phases")
        .insert({
          name: parsed.name.trim(),
          description: null,
          duration_weeks: parsed.duration_weeks,
          order_index: planPhaseCount + 1,
          created_by: createdBy,
        })
        .select("id,name,description,duration_weeks,order_index")
        .single();
      if (phaseErr) throw phaseErr;
      const phaseId = phaseRow.id as string;

      if (scIds.length) {
        const { error } = await supabase.from("phase_subcompetences").insert(
          scIds.map((id) => ({
            phase_id: phaseId,
            subcompetence_id: id,
          }))
        );
        if (error) throw error;
      }

      if (parsed.blocks.length) {
        const { error } = await supabase.from("topics").insert(
          parsed.blocks.map((b, idx) => ({
            phase_id: phaseId,
            subcompetence_id: b.subcompetence_id,
            name: b.name.trim(),
            description: null,
            order_index: idx + 1,
          }))
        );
        if (error) throw error;
      }

      if (parsed.gates.length) {
        const { error } = await supabase.from("gates").insert(
          parsed.gates.map((g) => ({
            phase_id: phaseId,
            name: g.name.trim(),
            description: null,
            gate_type: g.gate_type,
            pass_threshold: g.pass_threshold,
          }))
        );
        if (error) throw error;
      }

      const scMap = new Map(subcompetences.map((s) => [s.id, s]));
      const selectedSc = scIds.map((id) => scMap.get(id)).filter(Boolean) as Subcompetence[];
      const blocks: Block[] = parsed.blocks.map((b, idx) => ({
        name: b.name,
        order_index: idx + 1,
        subcompetence_id: b.subcompetence_id,
      }));
      const gates: Gate[] = parsed.gates.map((g) => ({
        name: g.name,
        gate_type: g.gate_type,
        pass_threshold: g.pass_threshold,
      }));

      const phase: Phase = {
        id: phaseId,
        name: phaseRow.name as string,
        description: (phaseRow.description as string | null) ?? null,
        duration_weeks: (phaseRow.duration_weeks as number | null) ?? null,
        order_index: (phaseRow.order_index as number | null) ?? null,
        subcompetences: selectedSc,
        blocks,
        gates,
      };

      await onCreated(phase);
      form.reset();
      setTab("existing");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "gap-2",
          triggerClassName
        )}
      >
        <Plus className="h-4 w-4" />
        Add Phase
        <ChevronDown className="h-4 w-4 opacity-80" />
      </PopoverTrigger>
      <PopoverContent className="p-0" style={popoverTintStyle}>
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-tp-primary">Add a phase</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("existing")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tab === "existing"
                  ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                  : "hover-tint border-border/70 text-tp-secondary"
              )}
            >
              Existing phases
            </button>
            <button
              type="button"
              onClick={() => setTab("create")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tab === "create"
                  ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                  : "hover-tint border-border/70 text-tp-secondary"
              )}
            >
              Create new phase
            </button>
          </div>
        </div>

        {tab === "existing" ? (
          <div className="max-h-[420px] overflow-y-auto p-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phases…"
            />
            <div className="mt-3 space-y-2">
              {filtered.map((p) => {
                const disabled = existingDisabledIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => void onAddExisting(p)}
                    className={cn(
                      "tp-phase-picker-existing-card w-full rounded-xl border px-3 py-2 text-left transition-colors",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                    style={existingCardStyle}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-tp-primary">
                          {p.name}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {p.subcompetences.slice(0, 4).map((s) => (
                            <span
                              key={s.id}
                              className="subcompetence-chip px-2 py-0.5 text-xs"
                              style={chipStyle(s.color)}
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-tp-muted">
                          <span>{p.blocks.length} blocks</span>
                          <span>{p.gates.length} gates</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {disabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                            <Check className="h-3.5 w-3.5" />
                            Added
                          </span>
                        ) : (
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                            {p.duration_weeks ?? "—"}w
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto p-3">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-tp-secondary">
                  Phase name <span className="text-negative">*</span>
                </Label>
                <Input className="mt-2" {...form.register("name")} />
                {form.formState.errors.name?.message ? (
                  <p className="mt-1 text-xs text-negative">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label className="text-sm font-medium text-tp-secondary">
                  Duration (weeks) <span className="text-negative">*</span>
                </Label>
                <Input
                  className="mt-2"
                  type="number"
                  min={1}
                  {...form.register("duration_weeks")}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-tp-secondary">
                  Subcompetences <span className="text-negative">*</span>
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subcompetences.map((s) => {
                    const selected = values.subcompetence_ids.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? values.subcompetence_ids.filter((x) => x !== s.id)
                            : [...values.subcompetence_ids, s.id];
                          form.setValue("subcompetence_ids", next, { shouldValidate: true });
                        }}
                        className={cn(
                          "subcompetence-chip px-2 py-1 text-xs transition-opacity",
                          selected ? "" : "opacity-50 hover:opacity-75"
                        )}
                        style={chipStyle(s.color)}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.subcompetence_ids?.message ? (
                  <p className="mt-1 text-xs text-negative">
                    {String(form.formState.errors.subcompetence_ids.message)}
                  </p>
                ) : null}

                <div className="mt-3 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-3">
                  <label className="flex items-center gap-2 text-xs text-tp-secondary">
                    <input
                      type="checkbox"
                      checked={newSc.enabled}
                      onChange={(e) =>
                        form.setValue("newSubcompetence.enabled", e.target.checked)
                      }
                    />
                    New subcompetence
                  </label>
                  {newSc.enabled ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label className="text-xs font-medium text-tp-secondary">
                          Name
                        </Label>
                        <Input
                          className="mt-1"
                          {...form.register("newSubcompetence.name")}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-tp-secondary">
                          Color
                        </Label>
                        <input
                          type="color"
                          className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border bg-transparent"
                          value={newSc.color ?? "var(--color-text-accent)"}
                          onChange={(e) =>
                            form.setValue("newSubcompetence.color", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-tp-secondary">
                          Icon
                        </Label>
                        <select
                          className="glass-input mt-1 h-10 w-full rounded-lg px-2 text-sm text-tp-primary"
                          value={newSc.icon ?? "dot"}
                          onChange={(e) =>
                            form.setValue("newSubcompetence.icon", e.target.value)
                          }
                        >
                          <option value="dot">Dot</option>
                          <option value="code">Code</option>
                          <option value="flask">Flask</option>
                          <option value="puzzle">Puzzle</option>
                        </select>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-tp-primary">Blocks</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addBlock({ name: `Block ${blockFields.length + 1}`, subcompetence_id: null })}
                  >
                    Add block
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  {blockFields.map((f, idx) => (
                    <div key={f.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-tp-secondary">
                          Block {idx + 1}
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-1 text-negative/90 hover:bg-negative/10"
                          onClick={() => removeBlock(idx)}
                          aria-label="Remove block"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Input className="mt-2" placeholder="Block name" {...form.register(`blocks.${idx}.name`)} />
                      <div className="mt-2">
                        <Label className="text-xs font-medium text-tp-secondary">
                          Macro-competence
                        </Label>
                        <select
                          className="glass-input mt-1 h-10 w-full rounded-lg px-2 text-sm text-tp-primary"
                          value={values.blocks[idx]?.subcompetence_id ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              `blocks.${idx}.subcompetence_id`,
                              e.target.value || null
                            )
                          }
                        >
                          <option value="">—</option>
                          {values.subcompetence_ids.map((id) => {
                            const sc = subcompetences.find((s) => s.id === id);
                            return sc ? (
                              <option key={sc.id} value={sc.id}>
                                {sc.name}
                              </option>
                            ) : null;
                          })}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-tp-primary">Gates</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addGate({
                        name: `Gate ${gateFields.length + 1}`,
                        gate_type: "phase_gate",
                        pass_threshold: 70,
                      })
                    }
                  >
                    Add gate
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  {gateFields.map((f, idx) => (
                    <div key={f.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-tp-secondary">
                          Gate {idx + 1}
                        </div>
                        <button
                          type="button"
                          className="rounded-md p-1 text-negative/90 hover:bg-negative/10"
                          onClick={() => removeGate(idx)}
                          aria-label="Remove gate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Input className="mt-2" placeholder="Gate name" {...form.register(`gates.${idx}.name`)} />
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium text-tp-secondary">
                            Type
                          </Label>
                          <div className="mt-1 flex gap-2">
                            {(["block_gate", "phase_gate"] as const).map((t) => {
                              const active = values.gates[idx]?.gate_type === t;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => form.setValue(`gates.${idx}.gate_type`, t)}
                                  className={cn(
                                    "rounded-full border px-2 py-1 text-xs",
                                    active
                                      ? "border-border bg-[var(--color-accent-muted)] text-tp-primary"
                                      : "hover-tint border-border/70 text-tp-secondary"
                                  )}
                                >
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-tp-secondary">
                            Pass threshold %
                          </Label>
                          <Input
                            className="mt-1"
                            type="number"
                            min={0}
                            max={100}
                            {...form.register(`gates.${idx}.pass_threshold`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={creating}
                onClick={() => void createAndAdd()}
              >
                {creating ? "Creating…" : "Create & Add to Plan"}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

