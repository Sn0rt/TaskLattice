import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Play,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useCurrentProjectId } from "@/hooks/use-project";
import {
  useEvaluationLayerState,
  useEvaluationLayerStore,
} from "../mock-provider";
import { EvaluationLayerStatusBadge } from "../shared/evaluation-status";
import {
  EvaluationMetric,
  EvaluationSection,
  EvaluationTable,
  JsonPreview,
  KeyValueGrid,
  formatCost,
  formatPercent,
} from "../shared/evaluation-ui";

function runStats(
  state: ReturnType<typeof useEvaluationLayerState>,
  runId: string,
) {
  const run = state.runs.find((item) => item.id === runId)!;
  const done = run.results.filter((result) => result.status !== "PENDING");
  const traceIds = new Set(
    done.map((result) => result.traceId).filter(Boolean),
  );
  const cost = state.traces
    .filter((trace) => traceIds.has(trace.id))
    .reduce((sum, trace) => sum + trace.costUsd, 0);
  return {
    done,
    cost,
    passRate: done.length
      ? done.filter((item) => item.status === "PASS").length / done.length
      : 0,
  };
}

export function EvaluationRunList() {
  const state = useEvaluationLayerState();
  const projectId = useCurrentProjectId();
  return (
    <>
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/$projectId/evaluation/runs/new" params={{ projectId }}>
            <Plus className="size-4" />
            New Evaluation
          </Link>
        </Button>
      </div>
      <EvaluationTable>
        <thead>
          <tr>
            <th>Evaluation</th>
            <th>Agent</th>
            <th>Policy</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Started</th>
            <th>Completed</th>
            <th>Report</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...state.runs]
            .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
            .map((run) => {
              const target = state.targets.find(
                (item) => item.id === run.targetId,
              );
              const dataset = state.datasets.find(
                (item) => item.id === run.datasetId,
              );
              const done = run.results.filter(
                (item) => item.status !== "PENDING",
              ).length;
              const report = state.reports.find(
                (item) => item.runId === run.id,
              );
              return (
                <tr key={run.id}>
                  <td className="font-mono text-xs">{run.id}</td>
                  <td>{target?.name}</td>
                  <td>{dataset?.name}</td>
                  <td>
                    <EvaluationLayerStatusBadge status={run.status} />
                  </td>
                  <td>
                    {done}/{run.results.length}
                  </td>
                  <td>{new Date(run.startedAt).toLocaleString()}</td>
                  <td>
                    {run.completedAt
                      ? new Date(run.completedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    {report ? (
                      <Link
                        className="font-mono text-xs hover:underline"
                        to="/$projectId/evaluation/reports/$reportId"
                        params={{ projectId, reportId: report.id }}
                      >
                        {report.id}
                      </Link>
                    ) : (
                      "Not available"
                    )}
                  </td>
                  <td>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/$projectId/evaluation/runs/$runId"
                        params={{ projectId, runId: run.id }}
                      >
                        Open
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </EvaluationTable>
    </>
  );
}

export function EvaluationRunSetup() {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const navigate = useNavigate();
  const initialTarget =
    state.targets.find((item) => item.id === state.settings.activeTargetId) ??
    state.targets[0]!;
  const [targetRevisionId, setTargetRevisionId] = useState(
    initialTarget.currentRevisionId,
  );
  const targetRevision = state.targetRevisions.find(
    (item) => item.id === targetRevisionId,
  )!;
  const datasets = state.datasetRevisions.filter(
    (item) =>
      item.targetId === targetRevision.targetId && item.status === "PUBLISHED",
  );
  const [datasetRevisionId, setDatasetRevisionId] = useState(
    datasets[0]?.id ?? "",
  );
  const [selected, setSelected] = useState(
    () =>
      new Set(
        state.evaluators.filter((item) => item.enabled).map((item) => item.id),
      ),
  );
  const create = () => {
    const result = store.createRun({
      targetRevisionId,
      datasetRevisionId,
      evaluatorIds: [...selected],
    });
    if (result.ok)
      void navigate({
        to: "/$projectId/evaluation/runs/$runId",
        params: { projectId, runId: result.value.runId },
      });
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <EvaluationSection
        title="Evaluation configuration"
        description="Choose immutable Agent and Policy revisions before selecting evaluators."
      >
        <div className="grid gap-5">
          <Label className="grid gap-2">
            Agent revision
            <select
              className="h-11 rounded-md border bg-background px-3"
              value={targetRevisionId}
              onChange={(event) => {
                const next = event.target.value;
                setTargetRevisionId(next);
                const revision = state.targetRevisions.find(
                  (item) => item.id === next,
                )!;
                const dataset = state.datasetRevisions.find(
                  (item) =>
                    item.targetId === revision.targetId &&
                    item.status === "PUBLISHED",
                );
                setDatasetRevisionId(dataset?.id ?? "");
              }}
            >
              {state.targetRevisions.map((revision) => {
                const target = state.targets.find(
                  (item) => item.id === revision.targetId,
                );
                return (
                  <option key={revision.id} value={revision.id}>
                    {target?.name} · v{revision.revision} · {revision.model}
                  </option>
                );
              })}
            </select>
          </Label>
          <Label className="grid gap-2">
            Policy revision
            <select
              className="h-11 rounded-md border bg-background px-3"
              value={datasetRevisionId}
              onChange={(event) => setDatasetRevisionId(event.target.value)}
            >
              {datasets.map((revision) => {
                const dataset = state.datasets.find(
                  (item) => item.id === revision.datasetId,
                );
                return (
                  <option key={revision.id} value={revision.id}>
                    {dataset?.name} · v{revision.revision} ·{" "}
                    {revision.cases.length} Cases
                  </option>
                );
              })}
            </select>
          </Label>
        </div>
      </EvaluationSection>
      <EvaluationSection
        title="Evaluators"
        description="Evaluator sources: Built-in and Langfuse."
      >
        <div className="grid gap-3">
          {state.evaluators.map((evaluator) => (
            <label
              key={evaluator.id}
              className="flex items-center justify-between rounded-md border p-4"
            >
              <span>
                <span className="font-medium">{evaluator.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {evaluator.provider === "BUILT_IN" ? "Built-in" : "Langfuse"}{" "}
                  · {evaluator.version}
                </span>
              </span>
              <input
                type="checkbox"
                checked={selected.has(evaluator.id)}
                onChange={(event) =>
                  setSelected((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(evaluator.id);
                    else next.delete(evaluator.id);
                    return next;
                  })
                }
              />
            </label>
          ))}
        </div>
      </EvaluationSection>
      <EvaluationSection title="Judge model">
        <KeyValueGrid
          items={[
            ["Provider", state.settings.provider],
            ["Model", state.settings.model],
            ["Mode", "Recorded deterministic demo"],
          ]}
        />
      </EvaluationSection>
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!datasetRevisionId || !selected.size}
          onClick={create}
        >
          <Play className="size-4" />
          Start Evaluation
        </Button>
      </div>
    </div>
  );
}

export function EvaluationRunDetail({ runId }: { runId: string }) {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const run = state.runs.find((item) => item.id === runId);
  if (!run)
    return (
      <EmptyState
        icon={FlaskConical}
        title="Evaluation not found"
        description="This mock Evaluation does not exist."
        action={
          <Button asChild variant="outline">
            <Link to="/$projectId/evaluation/runs" params={{ projectId }}>
              Back to Evaluation
            </Link>
          </Button>
        }
      />
    );
  const target = state.targets.find((item) => item.id === run.targetId)!;
  const dataset = state.datasets.find((item) => item.id === run.datasetId)!;
  const datasetRevision = state.datasetRevisions.find(
    (item) => item.id === run.datasetRevisionId,
  )!;
  const stats = runStats(state, run.id);
  const progress = run.results.length
    ? stats.done.length / run.results.length
    : 0;
  const pending = run.results.find((item) => item.status === "PENDING");
  const currentCase = datasetRevision.cases.find(
    (item) => item.id === pending?.caseId,
  );
  const report = state.reports.find((item) => item.runId === run.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-mono text-xl font-semibold">{run.id}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {target.name} · {dataset.name}
          </p>
        </div>
        {pending ? (
          <Button onClick={() => store.advanceRun(run.id)}>
            <Play className="size-4" />
            Run next Case
          </Button>
        ) : report ? (
          <Button asChild>
            <Link
              to="/$projectId/evaluation/reports/$reportId"
              params={{ projectId, reportId: report.id }}
            >
              Open Report
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
      <KeyValueGrid
        items={[
          ["Agent revision", run.targetRevisionId],
          ["Policy revision", run.datasetRevisionId],
          ["Evaluators", run.evaluatorIds.join(", ")],
          ["Judge model", state.settings.model],
          ["Started", new Date(run.startedAt).toLocaleString()],
          ["Status", <EvaluationLayerStatusBadge status={run.status} />],
        ]}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <EvaluationMetric
          label="Progress"
          value={`${stats.done.length}/${run.results.length}`}
          detail={<Progress value={progress * 100} />}
        />
        <EvaluationMetric
          label="Pass rate"
          value={formatPercent(stats.passRate)}
        />
        <EvaluationMetric
          label="Evaluation cost"
          value={formatCost(stats.cost)}
        />
        <EvaluationMetric
          label="Current Case"
          value={pending?.caseId ?? "Complete"}
        />
      </div>
      {currentCase ? (
        <EvaluationSection
          title="Current Case"
          description="Each click advances exactly one deterministic Case."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Input
              </p>
              <JsonPreview value={currentCase.input} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Expected output
              </p>
              <JsonPreview value={currentCase.expectedOutput} />
            </div>
          </div>
        </EvaluationSection>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="Evaluation complete"
          description="All Cases have deterministic results and the Report is ready."
          action={
            report ? (
              <Button asChild>
                <Link
                  to="/$projectId/evaluation/reports/$reportId"
                  params={{ projectId, reportId: report.id }}
                >
                  Review Report
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}
      <EvaluationSection title="Case progress">
        <EvaluationTable>
          <thead>
            <tr>
              <th>Case</th>
              <th>Status</th>
              <th>Response</th>
              <th>Trace</th>
            </tr>
          </thead>
          <tbody>
            {run.results.map((result) => (
              <tr key={result.caseId}>
                <td>{result.caseId}</td>
                <td>
                  <EvaluationLayerStatusBadge status={result.status} />
                </td>
                <td>{result.response ?? "Waiting"}</td>
                <td>
                  {result.traceId ? (
                    <Link
                      className="font-mono text-xs hover:underline"
                      to="/$projectId/evaluation/traces/$traceId"
                      params={{ projectId, traceId: result.traceId }}
                    >
                      {result.traceId}
                    </Link>
                  ) : (
                    "Not available"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </EvaluationTable>
      </EvaluationSection>
    </div>
  );
}
