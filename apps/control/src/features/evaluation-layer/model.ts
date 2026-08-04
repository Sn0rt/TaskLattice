export interface EvaluationLayerTarget {
  id: string;
  name: string;
  description: string;
  currentRevisionId: string;
  createdAt: string;
}

export interface EvaluationLayerTool {
  id: string;
  name: string;
  description: string;
  connectionType: "agent" | "http" | "python";
  verificationRequired: boolean;
  enabled: boolean;
  tags: string[];
}

export interface EvaluationLayerTargetRevision {
  id: string;
  targetId: string;
  revision: number;
  model: string;
  adapter: string;
  tools: EvaluationLayerTool[];
  createdAt: string;
}

export interface EvaluationLayerCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  tags: string[];
  source: string;
}

export interface EvaluationLayerDataset {
  id: string;
  targetId: string;
  name: string;
  description: string;
  currentRevisionId: string;
  createdAt: string;
}

export interface EvaluationLayerDatasetRevision {
  id: string;
  datasetId: string;
  targetId: string;
  revision: number;
  status: "DRAFT" | "PUBLISHED";
  cases: EvaluationLayerCase[];
  createdAt: string;
}

export interface EvaluationLayerRun {
  id: string;
  targetId: string;
  targetRevisionId: string;
  datasetId: string;
  datasetRevisionId: string;
  evaluatorIds: string[];
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED";
  startedAt: string;
  completedAt?: string;
}

export interface EvaluationLayerReport {
  id: string;
  runId: string;
  status: "READY" | "FAILED";
  summary: string;
  createdAt: string;
}

export interface EvaluationLayerReflection {
  id: string;
  reportId: string;
  targetId: string;
  suggestion: string;
  status: "OPEN" | "APPLIED" | "DISMISSED";
  createdAt: string;
}

export interface EvaluationLayerToolEvidence {
  id: string;
  toolId: string;
  requested: boolean;
  executed: boolean;
  succeeded: boolean;
  effectVerified: boolean | null;
  verificationRequired: boolean;
  requestedArguments: Record<string, unknown>;
  executedArguments: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  endedAt: string | null;
  latencyMs: number | null;
  receipt: Record<string, unknown> | null;
}

export interface EvaluationLayerJudge {
  scores: Record<string, number>;
  reasons: Record<string, string>;
  summary: string;
  model: string;
  promptVersion: string;
}

export interface EvaluationLayerSpan {
  id: string;
  parentSpanId?: string;
  name: string;
  kind: "TRACE" | "AGENT" | "TOOL" | "JUDGE";
  status: "OK" | "ERROR";
  startedAt: string;
  endedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface EvaluationLayerTrace {
  id: string;
  runId: string;
  caseId: string;
  targetId: string;
  status: "PASS" | "FAIL" | "ERROR";
  startedAt: string;
  latencyMs?: number;
  costUsd: number;
  response: string;
  deterministicScores: Record<string, number>;
  deterministicReasons: Record<string, string>;
  toolEvidence: EvaluationLayerToolEvidence[];
  judge?: EvaluationLayerJudge;
  spans: EvaluationLayerSpan[];
  markedFailed: boolean;
}

export interface EvaluationLayerEvaluator {
  id: string;
  name: string;
  provider: "BUILT_IN" | "LANGFUSE";
  version: string;
  enabled: boolean;
}

export interface EvaluationLayerSettings {
  activeTargetId: string;
  activeDatasetId: string;
  selectedRunId: string;
  showRawSpans: boolean;
}

export interface EvaluationLayerState {
  targets: EvaluationLayerTarget[];
  targetRevisions: EvaluationLayerTargetRevision[];
  datasets: EvaluationLayerDataset[];
  datasetRevisions: EvaluationLayerDatasetRevision[];
  runs: EvaluationLayerRun[];
  reports: EvaluationLayerReport[];
  reflections: EvaluationLayerReflection[];
  traces: EvaluationLayerTrace[];
  evaluators: EvaluationLayerEvaluator[];
  settings: EvaluationLayerSettings;
}
