import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileChartColumn, XCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useCurrentProjectId } from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import type { EvaluationLayerLogEntry } from "../model";
import {
  useEvaluationLayerState,
  useEvaluationLayerStore,
} from "../mock-provider";
import {
  buildAuditAnalysis,
  buildBehaviorModel,
  buildPermissionMatrix,
  type BehaviorStep,
} from "./report-view-model";
import { EvaluationLayerStatusBadge } from "../shared/evaluation-status";
import {
  EvaluationMetric,
  EvaluationSection,
  EvaluationTable,
  KeyValueGrid,
  formatCost,
  formatPercent,
} from "../shared/evaluation-ui";

const STEP_ICON: Record<BehaviorStep["kind"], string> = {
  agent: "🧠",
  tool: "🔧",
  judge: "✓",
  span: "◇",
};

function AuditOutcomeBadge({
  outcome,
}: {
  outcome: EvaluationLayerLogEntry["outcome"];
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        outcome === "allowed" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        outcome === "blocked" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        (outcome === "violation" || outcome === "error") &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        outcome === "info" && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {outcome}
    </span>
  );
}

export function EvaluationReportDetail({ reportId }: { reportId: string }) {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const report = state.reports.find((item) => item.id === reportId);
  const [selected, setSelected] = useState<string[]>(() =>
    state.reflections
      .filter((item) => item.reportId === reportId && item.status === "OPEN")
      .map((item) => item.id),
  );
  if (!report)
    return (
      <EmptyState
        icon={FileChartColumn}
        title="Report not found"
        description="This immutable mock Report does not exist."
        action={
          <Button asChild variant="outline">
            <Link to="/$projectId/evaluation/runs" params={{ projectId }}>
              Back to Evaluation
            </Link>
          </Button>
        }
      />
    );
  const run = state.runs.find((item) => item.id === report.runId)!;
  const target = state.targets.find((item) => item.id === run.targetId)!;
  const dataset = state.datasets.find((item) => item.id === run.datasetId)!;
  const traces = state.traces.filter((item) => item.runId === run.id);
  const done = run.results.filter((item) => item.status !== "PENDING");
  const failures = done.filter(
    (item) => item.status === "FAIL" || item.status === "ERROR",
  );
  const passRate = done.length
    ? done.filter((item) => item.status === "PASS").length / done.length
    : 0;
  const cost = traces.reduce((sum, trace) => sum + trace.costUsd, 0);

  const reflections = state.reflections.filter(
    (item) => item.reportId === report.id,
  );
  const permission = buildPermissionMatrix(state, run);
  const behavior = buildBehaviorModel(state, run);
  const audit = buildAuditAnalysis(state, run);
  const [auditFilter, setAuditFilter] = useState<
    "all" | EvaluationLayerLogEntry["outcome"]
  >("all");
  const auditRows = audit.rows.filter(
    (entry) => auditFilter === "all" || entry.outcome === auditFilter,
  );
  return (
    <div className="space-y-6">
      <KeyValueGrid
        items={[
          ["Agent", target.name],
          ["Test Case", dataset.name],
          ["Evaluation", run.id],
          ["Report", report.id],
          ["Status", <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", report.status === "READY" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive")}>{report.status === "READY" ? "Success" : "Failed"}</span>],
          ["Created", new Date(report.createdAt).toLocaleString()],
        ]}
      />
      <Tabs defaultValue="overview" className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permission">Permission</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
      <EvaluationSection title="Quality & Reflection">
        {failures.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
              <XCircle className="size-4 shrink-0 text-destructive" />
              <strong className="text-destructive">{failures.length} failed</strong>
              <span className="text-muted-foreground">case{failures.length === 1 ? "" : "s"} · details below</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border p-4">
                <p className="text-sm font-semibold">Failure reasons</p>
                <div className="mt-3 space-y-3">
                  {failures.map((failure) => (
                    <div key={failure.caseId} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                      <p className="text-sm font-medium">{failure.caseId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{failure.response}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm font-semibold">LLM Judge</p>
                <div className="mt-3 space-y-3">
                  {traces.filter((trace) => failures.some((failure) => failure.traceId === trace.id)).map((trace) => (
                    <div key={trace.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{trace.caseId}</p>
                        <span className="text-xs text-muted-foreground">{trace.judge?.model ?? "Not available"}</span>
                      </div>
                      {trace.judge ? (
                        <>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(trace.judge.scores).map(([key, value]) => (
                              <span key={key} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{key}: {value}</span>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{trace.judge.summary}</p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Not available</p>
                      )}
                    </div>
                  ))}
                  {!traces.some((trace) => failures.some((failure) => failure.traceId === trace.id)) ? (
                    <p className="text-xs text-muted-foreground">No judge evidence for failed Cases.</p>
                  ) : null}
                </div>
              </div>
            </div>
            {reflections.length ? (
              <div className="rounded-md border p-4">
                <p className="text-sm font-semibold">Reflection</p>
                <div className="mt-3 space-y-2">
                  {reflections.map((reflection) => (
                    <label key={reflection.id} className="flex items-start gap-3 rounded-md border p-3">
                      <input type="checkbox" className="mt-0.5" disabled={reflection.status !== "OPEN"} checked={selected.includes(reflection.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, reflection.id] : current.filter((id) => id !== reflection.id))} />
                      <span>
                        <span className="text-sm font-medium">{reflection.suggestion}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">Status: {reflection.status}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => store.finishReflectionWithoutChanges(report.id)}>Finish without changes</Button>
                  <Button disabled={!selected.length} onClick={() => store.submitReflection(report.id, selected)}>Apply selected changes</Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <strong className="text-emerald-700 dark:text-emerald-300">All passed</strong>
            <span className="text-muted-foreground">
              {done.filter((item) => item.status === "PASS").length} / {done.length} cases · LLM Judge reviewed · {reflections.length} reflection suggestion{reflections.length === 1 ? "" : "s"} available
            </span>
          </div>
        )}
      </EvaluationSection>
      <EvaluationSection title="Summary">
        <div className="grid gap-4 md:grid-cols-3">
          <EvaluationMetric label="Pass rate" value={formatPercent(passRate)} />
          <EvaluationMetric
            label="Result"
            value={
              <span className="inline-flex flex-wrap items-baseline gap-x-2">
                <span className="text-emerald-600 dark:text-emerald-400">{done.filter((item) => item.status === "PASS").length}</span>
                <span className="text-xs text-muted-foreground">passed</span>
                <span className="text-destructive">{failures.length}</span>
                <span className="text-xs text-muted-foreground">failed</span>
              </span>
            }
          />
          <EvaluationMetric label="Total cost" value={formatCost(cost)} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{report.summary}</p>
      </EvaluationSection>
      <EvaluationSection title="Test Results">
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
            {done.map((result) => (
              <tr key={result.caseId}>
                <td>{result.caseId}</td>
                <td>
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", result.status === "PASS" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : result.status === "PENDING" ? "border-border bg-muted/40 text-muted-foreground" : "border-destructive/30 bg-destructive/10 text-destructive")}>
                    {result.status === "PASS" ? "Pass" : result.status === "PENDING" ? "Pending" : "Fail"}
                  </span>
                </td>
                <td>{result.response}</td>
                <td>
                  {result.traceId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        className="font-mono text-xs"
                        to="/$projectId/evaluation/traces/$traceId"
                        params={{ projectId, traceId: result.traceId }}
                      >
                        {result.traceId}
                      </Link>
                    </Button>
                  ) : (
                    "Not available"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </EvaluationTable>
      </EvaluationSection>
      <EvaluationSection title="Usage & Cost">
        <KeyValueGrid
          items={[
            ["Agent", formatCost(cost)],
            ["Judge", formatCost(done.length * 0.0004)],
            ["Evaluation total", formatCost(cost + done.length * 0.0004)],
            [
              "Average / Case",
              formatCost(done.length ? cost / done.length : 0),
            ],
            ["Trace count", traces.length],
            ["Currency", "USD"],
          ]}
        />
      </EvaluationSection>
        </TabsContent>
        <TabsContent value="permission" className="space-y-6">
      <EvaluationSection
        title="Permission"
        description={`${permission.compliant}/${permission.judged} decisions compliant · ${permission.violations} violation${permission.violations === 1 ? "" : "s"} · derived from the execution log.`}
      >
        <EvaluationTable>
          <thead>
            <tr>
              <th>Case</th>
              <th>Tool</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Compliant</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {permission.rows.map((row) => (
              <tr
                key={row.caseId}
                className={cn(row.actual === "VIOLATION" && "bg-destructive/5")}
              >
                <td>{row.caseId}</td>
                <td>{row.toolName}</td>
                <td>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      row.expectedDecision === "ALLOW" &&
                        "text-emerald-700 dark:text-emerald-300",
                      row.expectedDecision === "DENY" &&
                        "text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {row.expectedDecision}
                  </span>
                </td>
                <td>
                  {row.actual === "VIOLATION" ? (
                    <span className="font-medium text-destructive">
                      Executed despite DENY
                    </span>
                  ) : row.actual === "NOT_RECORDED" ? (
                    <span className="text-muted-foreground">Not recorded</span>
                  ) : (
                    row.actual.charAt(0) + row.actual.slice(1).toLowerCase()
                  )}
                </td>
                <td>
                  {row.compliant === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : row.compliant ? (
                    <span className="font-medium text-emerald-600">✓</span>
                  ) : (
                    <span className="font-medium text-destructive">✗</span>
                  )}
                </td>
                <td>
                  {row.traceId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        className="font-mono text-xs"
                        to="/$projectId/evaluation/traces/$traceId"
                        params={{ projectId, traceId: row.traceId }}
                      >
                        {row.traceId}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </EvaluationTable>
      </EvaluationSection>
        </TabsContent>
        <TabsContent value="behavior" className="space-y-6">
      <EvaluationSection
        title="Behavior"
        description={`${behavior.total} traces analyzed · ${behavior.anomalous} with anomalies · span chains with evidence-backed flags.`}
      >
        <div className="grid gap-3">
          {behavior.rows.map((row) => (
            <div
              key={row.traceId}
              className={cn(
                "rounded-md border p-4",
                row.anomalies.length > 0 && "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{row.caseId}</p>
                <EvaluationLayerStatusBadge status={row.status} />
              </div>
              {row.steps.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                  {row.steps.map((step, index) => (
                    <Fragment key={`${row.traceId}-${index}`}>
                      {index > 0 ? (
                        <ArrowRight className="size-3 text-muted-foreground" />
                      ) : null}
                      <span
                        className={cn(
                          "rounded border bg-background px-2 py-1",
                          step.flag === "error" &&
                            "border-destructive/40 text-destructive",
                        )}
                      >
                        {STEP_ICON[step.kind]} {step.name}
                        {step.latencyMs !== undefined
                          ? ` (${step.latencyMs}ms)`
                          : ""}
                      </span>
                    </Fragment>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No span evidence recorded.
                </p>
              )}
              {row.anomalies.length ? (
                <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  {row.anomalies.map((anomaly) => (
                    <li key={anomaly}>⚠ {anomaly}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </EvaluationSection>
        </TabsContent>
        <TabsContent value="audit" className="space-y-6">
      <EvaluationSection
        title="Audit log"
        description="Analysis of the execution log kept from the Evaluation run."
        action={
          <select
            aria-label="Filter audit outcome"
            className="h-8 rounded-md border bg-background px-2 text-xs"
            value={auditFilter}
            onChange={(event) =>
              setAuditFilter(
                event.target.value as "all" | EvaluationLayerLogEntry["outcome"],
              )
            }
          >
            <option value="all">All outcomes</option>
            <option value="allowed">allowed</option>
            <option value="blocked">blocked</option>
            <option value="violation">violation</option>
            <option value="error">error</option>
            <option value="info">info</option>
          </select>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <EvaluationMetric label="Entries" value={audit.entries} />
          <EvaluationMetric label="Tool calls" value={audit.toolCalls} />
          <EvaluationMetric label="Allowed" value={audit.allowed} />
          <EvaluationMetric label="Blocked" value={audit.blocked} />
          <EvaluationMetric label="Violations" value={audit.violations} />
          <EvaluationMetric label="Errors" value={audit.errors} />
        </div>
        <div className="mt-4">
          <EvaluationTable>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>Detail</th>
                <th>Trace</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    (entry.outcome === "violation" ||
                      entry.outcome === "error") &&
                      "bg-destructive/5",
                  )}
                >
                  <td className="whitespace-nowrap text-xs">
                    {new Date(entry.at).toLocaleTimeString("en-GB")}
                  </td>
                  <td className="text-xs">{entry.actor}</td>
                  <td className="text-xs">{entry.action.replaceAll("_", " ")}</td>
                  <td>
                    <AuditOutcomeBadge outcome={entry.outcome} />
                  </td>
                  <td className="text-xs">{entry.detail}</td>
                  <td>
                    {entry.traceId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          className="font-mono text-xs"
                          to="/$projectId/evaluation/traces/$traceId"
                          params={{ projectId, traceId: entry.traceId }}
                        >
                          {entry.traceId}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!auditRows.length ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground">
                    No log entries match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </EvaluationTable>
        </div>
      </EvaluationSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
