import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Copy,
  Database,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentProjectId } from "@/hooks/use-project";
import type { EvaluationLayerCase } from "../model";
import {
  useEvaluationLayerState,
  useEvaluationLayerStore,
} from "../mock-provider";
import { EvaluationLayerStatusBadge } from "../shared/evaluation-status";
import {
  EvaluationSection,
  EvaluationTable,
  JsonPreview,
  KeyValueGrid,
  formatCost,
  formatPercent,
} from "../shared/evaluation-ui";

function latestDraft(
  state: ReturnType<typeof useEvaluationLayerState>,
  datasetId: string,
) {
  return state.datasetRevisions
    .filter(
      (revision) =>
        revision.datasetId === datasetId && revision.status === "DRAFT",
    )
    .sort((a, b) => b.revision - a.revision)[0];
}

function datasetRunMetrics(
  state: ReturnType<typeof useEvaluationLayerState>,
  datasetId: string,
) {
  const run = [...state.runs]
    .filter((item) => item.datasetId === datasetId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const finished =
    run?.results.filter((result) => result.status !== "PENDING") ?? [];
  const passRate = finished.length
    ? finished.filter((item) => item.status === "PASS").length / finished.length
    : 0;
  const traceIds = new Set(
    finished.map((item) => item.traceId).filter(Boolean),
  );
  const cost = state.traces
    .filter((trace) => traceIds.has(trace.id))
    .reduce((sum, trace) => sum + trace.costUsd, 0);
  return { run, passRate, cost };
}

function DatasetEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const [targetId, setTargetId] = useState(state.settings.activeTargetId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = store.createDataset({ targetId, name, description });
    if (!result.ok) return setError(result.error);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Test Case</DialogTitle>
          <DialogDescription>
            Create an editable draft in the isolated Evaluation mock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 px-6 py-5">
            <Label className="grid gap-2">
              Agent
              <select
                className="h-9 rounded-md border bg-background px-3"
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
            <Label className="grid gap-2">
              Name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Label>
            <Label className="grid gap-2">
              Description
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Test Case</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CaseEditor({
  datasetId,
  datasetCase,
  open,
  onOpenChange,
}: {
  datasetId: string;
  datasetCase?: EvaluationLayerCase;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const store = useEvaluationLayerStore();
  const [query, setQuery] = useState(String(datasetCase?.input.query ?? ""));
  const [role, setRole] = useState(
    String(datasetCase?.input.user_role ?? "guest"),
  );
  const [tool, setTool] = useState(
    String(
      datasetCase?.expectedOutput.expected_tool_called ?? "EmployeeQueryTool",
    ),
  );
  const [permission, setPermission] = useState(
    String(datasetCase?.expectedOutput.permission_decision ?? "DENY"),
  );
  const [execution, setExecution] = useState(
    String(datasetCase?.expectedOutput.tool_execution ?? "BLOCK"),
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = {
      input: { query, user_role: role },
      expectedOutput: {
        expected_tool_called: tool,
        expected_action: `${permission}: ${execution} ${tool}`,
        permission_decision: permission,
        tool_execution: execution,
      },
      tags: [
        "permission",
        `tool:${tool}`,
        `decision:${permission.toLowerCase()}`,
      ],
      source: "ui-demo",
    };
    const result = datasetCase
      ? store.updateCase(datasetId, datasetCase.id, input)
      : store.createCase(datasetId, input);
    if (result.ok) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{datasetCase ? "Edit Case" : "Create Case"}</DialogTitle>
          <DialogDescription>
            Input fields appear before expected-output fields, matching the
            AgentEval workflow.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 px-6 py-5">
            <Label className="grid gap-2">
              Query
              <Textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Label>
            <Label className="grid gap-2">
              User role
              <Input
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
            </Label>
            <Label className="grid gap-2">
              Expected Tool
              <Input
                value={tool}
                onChange={(event) => setTool(event.target.value)}
              />
            </Label>
            <Label className="grid gap-2">
              Permission decision
              <select
                className="h-9 rounded-md border bg-background px-3"
                value={permission}
                onChange={(event) => setPermission(event.target.value)}
              >
                <option>ALLOW</option>
                <option>DENY</option>
              </select>
            </Label>
            <Label className="grid gap-2">
              Tool execution
              <select
                className="h-9 rounded-md border bg-background px-3"
                value={execution}
                onChange={(event) => setExecution(event.target.value)}
              >
                <option>EXECUTE</option>
                <option>BLOCK</option>
              </select>
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {datasetCase ? "Save Case" : "Create Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportCases({
  datasetId,
  open,
  onOpenChange,
}: {
  datasetId: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const store = useEvaluationLayerStore();
  const [json, setJson] = useState(
    '[\n  {\n    "input": {"query": "Check a mock permission", "user_role": "viewer"},\n    "expectedOutput": {"permission_decision": "DENY", "tool_execution": "BLOCK"},\n    "tags": ["imported"],\n    "source": "json"\n  }\n]',
  );
  const [message, setMessage] = useState("");
  const submit = () => {
    const result = store.importCases(datasetId, json);
    if (!result.ok) return setMessage(result.error);
    setMessage(`${result.value.imported} Cases imported`);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(calc(100%-2rem),48rem)]">
        <DialogHeader>
          <DialogTitle>Import Cases</DialogTitle>
          <DialogDescription>
            Paste a JSON array. No file or network request is used.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 px-6 py-5">
          <Textarea
            className="min-h-72 font-mono text-xs"
            value={json}
            onChange={(event) => setJson(event.target.value)}
          />
          {message ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Import Cases</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EvaluationDatasetList() {
  const state = useEvaluationLayerState();
  const projectId = useCurrentProjectId();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Test Case
        </Button>
      </div>
      <EvaluationTable>
        <thead>
          <tr>
            <th>Name</th>
            <th>Agent</th>
            <th>Revision</th>
            <th>Status</th>
            <th>Cases</th>
            <th>Last Evaluation</th>
            <th>Pass rate</th>
            <th>Evaluation cost</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {state.datasets.map((dataset) => {
            const revision = state.datasetRevisions.find(
              (item) => item.id === dataset.currentRevisionId,
            )!;
            const metrics = datasetRunMetrics(state, dataset.id);
            const target = state.targets.find(
              (item) => item.id === dataset.targetId,
            );
            return (
              <tr key={dataset.id}>
                <td>
                  <div className="font-medium">{dataset.name}</div>
                  <div className="max-w-56 truncate text-xs text-muted-foreground">
                    {dataset.description}
                  </div>
                </td>
                <td>{target?.name}</td>
                <td>v{revision.revision}</td>
                <td>
                  <EvaluationLayerStatusBadge status={revision.status} />
                </td>
                <td>{revision.cases.length}</td>
                <td>
                  {metrics.run ? (
                    <EvaluationLayerStatusBadge status={metrics.run.status} />
                  ) : (
                    "Not run"
                  )}
                </td>
                <td>{formatPercent(metrics.passRate)}</td>
                <td>{formatCost(metrics.cost)}</td>
                <td>
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to="/$projectId/evaluation/datasets/$datasetId"
                      params={{ projectId, datasetId: dataset.id }}
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
      <DatasetEditor open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EvaluationDatasetDetail({ datasetId }: { datasetId: string }) {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const navigate = useNavigate();
  const dataset = state.datasets.find((item) => item.id === datasetId);
  const [caseEditor, setCaseEditor] = useState<{
    open: boolean;
    item?: EvaluationLayerCase;
  }>({ open: false });
  const [importOpen, setImportOpen] = useState(false);
  if (!dataset)
    return (
      <EmptyState
        icon={Database}
        title="Test Case not found"
        description="This Test Case does not exist in the Evaluation demo."
        action={
          <Button asChild variant="outline">
            <Link to="/$projectId/evaluation/datasets" params={{ projectId }}>
              Back to Test Case
            </Link>
          </Button>
        }
      />
    );
  const revisions = state.datasetRevisions
    .filter((item) => item.datasetId === dataset.id)
    .sort((a, b) => b.revision - a.revision);
  const draft = latestDraft(state, dataset.id);
  const current = revisions.find(
    (item) => item.id === dataset.currentRevisionId,
  )!;
  const runs = state.runs
    .filter((item) => item.datasetId === dataset.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const evaluate = () => {
    const target = state.targets.find((item) => item.id === dataset.targetId)!;
    const result = store.createRun({
      targetRevisionId: target.currentRevisionId,
      datasetRevisionId: current.id,
      evaluatorIds: state.evaluators
        .filter((item) => item.enabled)
        .map((item) => item.id),
    });
    if (result.ok)
      void navigate({
        to: "/$projectId/evaluation/runs/$runId",
        params: { projectId, runId: result.value.runId },
      });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{dataset.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dataset.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => store.generateCases(dataset.id)}
          >
            <Sparkles className="size-4" />
            Generate
          </Button>
          <Button
            variant="outline"
            onClick={() => store.publishDatasetRevision(dataset.id)}
          >
            Publish
          </Button>
          <Button onClick={evaluate}>Evaluate</Button>
        </div>
      </div>
      <KeyValueGrid
        items={[
          [
            "Agent",
            state.targets.find((item) => item.id === dataset.targetId)?.name,
          ],
          ["Published revision", `v${current.revision}`],
          ["Draft cases", draft?.cases.length ?? 0],
          ["Published cases", current.cases.length],
          ["Revisions", revisions.length],
          ["Evaluations", runs.length],
        ]}
      />
      <Tabs defaultValue="cases">
        <TabsList variant="line">
          <TabsTrigger value="cases">Draft cases</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="history">Evaluation history</TabsTrigger>
        </TabsList>
        <TabsContent value="cases" className="pt-4">
          <EvaluationSection
            title="Draft cases"
            description="Edit, duplicate, delete, import, generate, then publish an immutable revision."
            action={
              <Button size="sm" onClick={() => setCaseEditor({ open: true })}>
                <Plus className="size-4" />
                Add Case
              </Button>
            }
          >
            <EvaluationTable>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Input</th>
                  <th>Expected output</th>
                  <th>Tags</th>
                  <th>Source</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft?.cases.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs">{item.id}</td>
                    <td>
                      <JsonPreview value={item.input} />
                    </td>
                    <td>
                      <JsonPreview value={item.expectedOutput} />
                    </td>
                    <td>{item.tags.join(", ")}</td>
                    <td>{item.source}</td>
                    <td>
                      <div className="flex">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Edit Case"
                          onClick={() => setCaseEditor({ open: true, item })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Duplicate Case"
                          onClick={() =>
                            store.duplicateCase(dataset.id, item.id)
                          }
                        >
                          <Copy />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete Case"
                          onClick={() => store.deleteCase(dataset.id, item.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </EvaluationTable>
          </EvaluationSection>
        </TabsContent>
        <TabsContent value="schema" className="pt-4">
          <EvaluationSection
            title="Schema"
            description="AgentEval-compatible case field roles and example values."
          >
            <EvaluationTable>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>query</td>
                  <td>Input</td>
                  <td>string</td>
                  <td>Restart the order-service service</td>
                </tr>
                <tr>
                  <td>user_role</td>
                  <td>Input</td>
                  <td>string</td>
                  <td>employee</td>
                </tr>
                <tr>
                  <td>permission_decision</td>
                  <td>Expected</td>
                  <td>ALLOW | DENY</td>
                  <td>DENY</td>
                </tr>
                <tr>
                  <td>tool_execution</td>
                  <td>Expected</td>
                  <td>EXECUTE | BLOCK</td>
                  <td>BLOCK</td>
                </tr>
              </tbody>
            </EvaluationTable>
          </EvaluationSection>
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <EvaluationSection title="Evaluation history">
            <EvaluationTable>
              <thead>
                <tr>
                  <th>Evaluation</th>
                  <th>Status</th>
                  <th>Pass rate</th>
                  <th>Total cases</th>
                  <th>Evaluation cost</th>
                  <th>Report ID</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const done = run.results.filter(
                    (item) => item.status !== "PENDING",
                  );
                  const report = state.reports.find(
                    (item) => item.runId === run.id,
                  );
                  const traceIds = new Set(done.map((item) => item.traceId));
                  const cost = state.traces
                    .filter((trace) => traceIds.has(trace.id))
                    .reduce((sum, trace) => sum + trace.costUsd, 0);
                  return (
                    <tr key={run.id}>
                      <td>
                        <Link
                          className="font-medium hover:underline"
                          to="/$projectId/evaluation/runs/$runId"
                          params={{ projectId, runId: run.id }}
                        >
                          {run.id}
                        </Link>
                      </td>
                      <td>
                        <EvaluationLayerStatusBadge status={run.status} />
                      </td>
                      <td>
                        {formatPercent(
                          done.length
                            ? done.filter((item) => item.status === "PASS")
                                .length / done.length
                            : 0,
                        )}
                      </td>
                      <td>{run.results.length}</td>
                      <td>{formatCost(cost)}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </EvaluationTable>
          </EvaluationSection>
        </TabsContent>
      </Tabs>
      <CaseEditor
        key={caseEditor.item?.id ?? "new"}
        datasetId={dataset.id}
        {...(caseEditor.item ? { datasetCase: caseEditor.item } : {})}
        open={caseEditor.open}
        onOpenChange={(open) => setCaseEditor({ open })}
      />
      <ImportCases
        datasetId={dataset.id}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
