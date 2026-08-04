import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCurrentProjectId } from "@/hooks/use-project";
import { useEvaluationLayerState } from "../mock-provider";
import { EvaluationLayerStatusBadge } from "../shared/evaluation-status";
import {
  EvaluationMetric,
  EvaluationSection,
  EvaluationTable,
  formatCost,
} from "../shared/evaluation-ui";

export function EvaluationOverviewPage() {
  const state = useEvaluationLayerState();
  const projectId = useCurrentProjectId();
  const [targetId, setTargetId] = useState(state.settings.activeTargetId);
  const traces = state.traces.filter((trace) => trace.targetId === targetId);
  const observations = traces.reduce(
    (sum, trace) =>
      sum +
      trace.spans.length +
      trace.toolEvidence.length +
      (trace.judge ? 1 : 0),
    0,
  );
  const failures = traces.filter(
    (trace) => trace.status !== "PASS" || trace.markedFailed,
  ).length;
  const cost = traces.reduce((sum, trace) => sum + trace.costUsd, 0);
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Label className="flex items-center gap-3">
          Agent
          <select
            className="h-9 min-w-64 rounded-md border bg-background px-3"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
          >
            {state.targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
        </Label>
      </div>
      {traces.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <EvaluationMetric
              label="Traces"
              value={traces.length}
              detail="Selected Agent"
            />
            <EvaluationMetric
              label="Observations"
              value={observations}
              detail="Spans + Tools + Judge"
            />
            <EvaluationMetric
              label="Failures"
              value={failures}
              detail="Failed or manually marked"
            />
            <EvaluationMetric
              label="Cost"
              value={formatCost(cost)}
              detail="Recorded mock usage"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <EvaluationSection
              title="Quality distribution"
              description="Pass, fail, and error traces for the selected Agent."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {["PASS", "FAIL", "ERROR"].map((status) => {
                  const count = traces.filter(
                    (trace) => trace.status === status,
                  ).length;
                  return (
                    <div key={status} className="rounded-md border p-4">
                      <EvaluationLayerStatusBadge status={status} />
                      <p className="mt-4 text-3xl font-semibold">{count}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(count / traces.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </EvaluationSection>
            <EvaluationSection title="Failure signals">
              <div className="grid gap-3">
                {traces
                  .filter(
                    (trace) => trace.status !== "PASS" || trace.markedFailed,
                  )
                  .map((trace) => (
                    <Link
                      key={trace.id}
                      to="/$projectId/evaluation/traces/$traceId"
                      params={{ projectId, traceId: trace.id }}
                      className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40"
                    >
                      <span>
                        <span className="block font-medium">
                          {trace.caseId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {trace.response}
                        </span>
                      </span>
                      <ArrowRight className="size-4" />
                    </Link>
                  ))}
              </div>
            </EvaluationSection>
          </div>
          <EvaluationSection title="Recent traces">
            <EvaluationTable>
              <thead>
                <tr>
                  <th>Trace</th>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Observations</th>
                  <th>Latency</th>
                  <th>Cost</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {traces.map((trace) => (
                  <tr key={trace.id}>
                    <td className="font-mono text-xs">{trace.id}</td>
                    <td>{trace.caseId}</td>
                    <td>
                      <EvaluationLayerStatusBadge status={trace.status} />
                    </td>
                    <td>
                      {trace.spans.length +
                        trace.toolEvidence.length +
                        (trace.judge ? 1 : 0)}
                    </td>
                    <td>
                      {trace.latencyMs
                        ? `${trace.latencyMs} ms`
                        : "Not available"}
                    </td>
                    <td>{formatCost(trace.costUsd)}</td>
                    <td>
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          to="/$projectId/evaluation/traces/$traceId"
                          params={{ projectId, traceId: trace.id }}
                        >
                          Open
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </EvaluationTable>
          </EvaluationSection>
        </>
      ) : (
        <EmptyState
          icon={ChartNoAxesCombined}
          title="No traces for this Agent"
          description="Run an Evaluation to populate quality, failure, latency, and cost metrics."
        />
      )}
    </div>
  );
}
