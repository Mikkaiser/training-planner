"use client";

export type Phase = {
  id: string;
  name: string;
  order_index: number | null;
};

export type Gate = {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  gate_type: "block_gate" | "phase_gate";
  pass_threshold: number | null;
};

export type Assessment = {
  id: string;
  gate_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
};

export type GatesData = {
  phases: Phase[];
  gatesByPhase: Map<string, Gate[]>;
  assessmentsByGate: Map<string, Assessment[]>;
};

