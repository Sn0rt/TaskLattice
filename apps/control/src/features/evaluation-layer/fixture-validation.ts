import { evaluationLayerFixtures } from "./fixtures";
import type { EvaluationLayerState } from "./model";

export function cloneEvaluationLayerFixtures(): EvaluationLayerState {
  return structuredClone(evaluationLayerFixtures);
}

export function validateEvaluationLayerState(state: EvaluationLayerState): string[] {
  const errors: string[] = [];
  const targetIds = new Set(state.targets.map((target) => target.id));
  const targetRevisionIds = new Set(state.targetRevisions.map((revision) => revision.id));
  const datasetIds = new Set(state.datasets.map((dataset) => dataset.id));
  const datasetRevisionIds = new Set(state.datasetRevisions.map((revision) => revision.id));
  const runIds = new Set(state.runs.map((run) => run.id));
  const reportIds = new Set(state.reports.map((report) => report.id));
  const evaluatorIds = new Set(state.evaluators.map((evaluator) => evaluator.id));

  const requireReference = (path: string, id: string, ids: Set<string>) => {
    if (!ids.has(id)) errors.push(`${path}: ${id}`);
  };

  for (const target of state.targets) {
    requireReference(`targets.${target.id}.currentRevisionId`, target.currentRevisionId, targetRevisionIds);
    const revision = state.targetRevisions.find((item) => item.id === target.currentRevisionId);
    if (revision?.targetId !== target.id) errors.push(`targets.${target.id}.currentRevisionId: ${target.currentRevisionId}`);
  }
  for (const revision of state.targetRevisions) requireReference(`targetRevisions.${revision.id}.targetId`, revision.targetId, targetIds);
  for (const dataset of state.datasets) {
    requireReference(`datasets.${dataset.id}.targetId`, dataset.targetId, targetIds);
    requireReference(`datasets.${dataset.id}.currentRevisionId`, dataset.currentRevisionId, datasetRevisionIds);
    const revision = state.datasetRevisions.find((item) => item.id === dataset.currentRevisionId);
    if (revision?.datasetId !== dataset.id) errors.push(`datasets.${dataset.id}.currentRevisionId: ${dataset.currentRevisionId}`);
  }
  for (const revision of state.datasetRevisions) {
    requireReference(`datasetRevisions.${revision.id}.datasetId`, revision.datasetId, datasetIds);
    requireReference(`datasetRevisions.${revision.id}.targetId`, revision.targetId, targetIds);
  }
  for (const run of state.runs) {
    requireReference(`runs.${run.id}.targetId`, run.targetId, targetIds);
    requireReference(`runs.${run.id}.targetRevisionId`, run.targetRevisionId, targetRevisionIds);
    requireReference(`runs.${run.id}.datasetId`, run.datasetId, datasetIds);
    requireReference(`runs.${run.id}.datasetRevisionId`, run.datasetRevisionId, datasetRevisionIds);
    for (const evaluatorId of run.evaluatorIds) requireReference(`runs.${run.id}.evaluatorIds`, evaluatorId, evaluatorIds);
  }
  for (const report of state.reports) requireReference(`reports.${report.id}.runId`, report.runId, runIds);
  for (const reflection of state.reflections) {
    requireReference(`reflections.${reflection.id}.reportId`, reflection.reportId, reportIds);
    requireReference(`reflections.${reflection.id}.targetId`, reflection.targetId, targetIds);
  }
  for (const trace of state.traces) {
    requireReference(`traces.${trace.id}.runId`, trace.runId, runIds);
    requireReference(`traces.${trace.id}.targetId`, trace.targetId, targetIds);
    const run = state.runs.find((item) => item.id === trace.runId);
    const datasetRevision = state.datasetRevisions.find((item) => item.id === run?.datasetRevisionId);
    if (!datasetRevision?.cases.some((item) => item.id === trace.caseId)) errors.push(`traces.${trace.id}.caseId: ${trace.caseId}`);
    const spanIds = new Set(trace.spans.map((span) => span.id));
    for (const span of trace.spans) if (span.parentSpanId) requireReference(`traces.${trace.id}.spans.${span.id}.parentSpanId`, span.parentSpanId, spanIds);
  }
  requireReference("settings.activeTargetId", state.settings.activeTargetId, targetIds);
  requireReference("settings.activeDatasetId", state.settings.activeDatasetId, datasetIds);
  requireReference("settings.selectedRunId", state.settings.selectedRunId, runIds);
  return errors;
}
