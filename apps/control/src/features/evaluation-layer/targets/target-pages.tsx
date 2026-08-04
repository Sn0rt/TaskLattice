import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Target as TargetIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrentProjectId } from "@/hooks/use-project";
import { useEvaluationLayerState, useEvaluationLayerStore } from "../mock-provider";
import { EvaluationLayerStatusBadge } from "../shared/evaluation-status";
import {
  EvaluationMetric,
  EvaluationSection,
  EvaluationTable,
  KeyValueGrid,
  formatCost,
  formatPercent,
} from "../shared/evaluation-ui";

function targetMetrics(state: ReturnType<typeof useEvaluationLayerState>, targetId: string) {
  const runs = state.runs.filter((run) => run.targetId === targetId);
  const latest = [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const completed = latest?.results.filter((result) => result.status !== "PENDING") ?? [];
  const passed = completed.filter((result) => result.status === "PASS").length;
  const traceIds = new Set(completed.map((result) => result.traceId).filter(Boolean));
  const cost = state.traces
    .filter((trace) => traceIds.has(trace.id))
    .reduce((total, trace) => total + trace.costUsd, 0);
  return {
    latest,
    passRate: completed.length ? passed / completed.length : 0,
    cost,
  };
}

function TargetEditor({
  open,
  onOpenChange,
  targetId,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  targetId?: string;
}) {
  const store = useEvaluationLayerStore();
  const state = useEvaluationLayerState();
  const target = state.targets.find((item) => item.id === targetId);
  const revision = target
    ? state.targetRevisions.find((item) => item.id === target.currentRevisionId)
    : undefined;
  const [name, setName] = useState(target?.name ?? "");
  const [description, setDescription] = useState(target?.description ?? "");
  const [model, setModel] = useState(revision?.model ?? "gpt-5-mini");
  const [adapter, setAdapter] = useState(revision?.adapter ?? "permission-compliance");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = targetId
      ? store.createTargetRevision(targetId, { model, adapter })
      : store.createTarget({ name, description, model, adapter });
    if (!result.ok) return setError(result.error);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{targetId ? "Create Agent revision" : "Create Agent"}</DialogTitle>
          <DialogDescription>Changes stay inside this browser-tab mock store.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 px-6 py-5">
            {!targetId ? (
              <>
                <Label className="grid gap-2">Name<Input value={name} onChange={(event) => setName(event.target.value)} /></Label>
                <Label className="grid gap-2">Description<Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Label>
              </>
            ) : null}
            <Label className="grid gap-2">Model<Input value={model} onChange={(event) => setModel(event.target.value)} /></Label>
            <Label className="grid gap-2">Adapter<Input value={adapter} onChange={(event) => setAdapter(event.target.value)} /></Label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{targetId ? "Create revision" : "Create Agent"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EvaluationTargetList() {
  const state = useEvaluationLayerState();
  const projectId = useCurrentProjectId();
  const [editorOpen, setEditorOpen] = useState(false);
  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditorOpen(true)}><Plus className="size-4" />New Agent</Button>
      </div>
      <EvaluationTable>
        <thead><tr><th>Name</th><th>Model</th><th>Revision</th><th>Tools</th><th>MCP Servers</th><th>Knowledge Bases</th><th>Last status</th><th>Pass rate</th><th>Evaluation cost</th><th /></tr></thead>
        <tbody>
          {state.targets.map((target) => {
            const revision = state.targetRevisions.find((item) => item.id === target.currentRevisionId)!;
            const metrics = targetMetrics(state, target.id);
            return (
              <tr key={target.id}>
                <td><div className="font-medium">{target.name}</div><div className="max-w-56 truncate text-xs text-muted-foreground">{target.description}</div></td>
                <td>{revision.model}</td><td>v{revision.revision}</td><td>{revision.tools.length}</td><td>0</td><td>0</td>
                <td>{metrics.latest ? <EvaluationLayerStatusBadge status={metrics.latest.status} /> : "Not run"}</td>
                <td>{formatPercent(metrics.passRate)}</td><td>{formatCost(metrics.cost)}</td>
                <td><Button asChild size="sm" variant="ghost"><Link to="/$projectId/evaluation/targets/$targetId" params={{ projectId, targetId: target.id }}>Open<ArrowRight className="size-4" /></Link></Button></td>
              </tr>
            );
          })}
        </tbody>
      </EvaluationTable>
      <TargetEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  );
}

export function EvaluationTargetDetail({ targetId }: { targetId: string }) {
  const state = useEvaluationLayerState();
  const projectId = useCurrentProjectId();
  const [editorOpen, setEditorOpen] = useState(false);
  const target = state.targets.find((item) => item.id === targetId);
  const revisions = useMemo(
    () => state.targetRevisions.filter((item) => item.targetId === targetId).sort((a, b) => b.revision - a.revision),
    [state.targetRevisions, targetId],
  );
  if (!target) {
    return <EmptyState icon={TargetIcon} title="Agent not found" description="This Agent does not exist in the Evaluation demo." action={<Button asChild variant="outline"><Link to="/$projectId/evaluation/targets" params={{ projectId }}>Back to Agent</Link></Button>} />;
  }
  const current = revisions.find((item) => item.id === target.currentRevisionId)!;
  const metrics = targetMetrics(state, target.id);
  const reports = state.reports.filter((report) => state.runs.find((run) => run.id === report.runId)?.targetId === target.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-2xl font-semibold">{target.name}</h2><p className="mt-1 text-sm text-muted-foreground">{target.description}</p></div>
        <Button onClick={() => setEditorOpen(true)}><Plus className="size-4" />New revision</Button>
      </div>
      <KeyValueGrid items={[["Status", metrics.latest ? <EvaluationLayerStatusBadge status={metrics.latest.status} /> : "Not run"], ["Current revision", `v${current.revision}`], ["Created", new Date(target.createdAt).toLocaleString()]]} />
      <div className="grid gap-4 md:grid-cols-3"><EvaluationMetric label="Pass rate" value={formatPercent(metrics.passRate)} detail="Latest Evaluation" /><EvaluationMetric label="Evaluation cost" value={formatCost(metrics.cost)} detail="Agent + judge mock cost" /><EvaluationMetric label="Reports" value={reports.length} detail="Immutable evaluation reports" /></div>
      <EvaluationSection title="Current revision" description="Version-pinned configuration used by new Evaluations."><KeyValueGrid items={[["Revision", `v${current.revision}`], ["Model", current.model], ["Adapter", current.adapter], ["Tools", current.tools.length], ["MCP Servers", "None configured"], ["Knowledge Bases", "None configured"]]} /></EvaluationSection>
      <EvaluationSection title="Model"><p className="font-mono text-sm">{current.model}</p></EvaluationSection>
      <EvaluationSection title="Tools" description="Tool bindings and verification requirements."><EvaluationTable><thead><tr><th>Tool</th><th>Connection</th><th>Verification</th><th>Tags</th></tr></thead><tbody>{current.tools.map((tool) => <tr key={tool.id}><td><div className="font-medium">{tool.name}</div><div className="text-xs text-muted-foreground">{tool.description}</div></td><td>{tool.connectionType}</td><td>{tool.verificationRequired ? "Required" : "Optional"}</td><td>{tool.tags.join(", ")}</td></tr>)}</tbody></EvaluationTable></EvaluationSection>
      <div className="grid gap-6 lg:grid-cols-2"><EvaluationSection title="MCP Servers"><p className="text-sm text-muted-foreground">No MCP Servers configured.</p></EvaluationSection><EvaluationSection title="Knowledge Bases"><p className="text-sm text-muted-foreground">No Knowledge Bases configured.</p></EvaluationSection></div>
      <EvaluationSection title="Revision history"><EvaluationTable><thead><tr><th>Revision</th><th>Model</th><th>Adapter</th><th>Tools</th><th>Created</th></tr></thead><tbody>{revisions.map((revision) => <tr key={revision.id}><td>v{revision.revision}</td><td>{revision.model}</td><td>{revision.adapter}</td><td>{revision.tools.length}</td><td>{new Date(revision.createdAt).toLocaleString()}</td></tr>)}</tbody></EvaluationTable></EvaluationSection>
      <EvaluationSection title="Trends" description="Quality and cost across Evaluation history."><div className="grid gap-4 md:grid-cols-2"><div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Quality trend</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500" style={{ width: formatPercent(metrics.passRate) }} /></div><p className="mt-2 text-sm font-medium">{formatPercent(metrics.passRate)}</p></div><div className="rounded-md border p-4"><p className="text-xs text-muted-foreground">Cost trend</p><p className="mt-4 text-2xl font-semibold">{formatCost(metrics.cost)}</p><p className="text-xs text-muted-foreground">Latest run</p></div></div></EvaluationSection>
      <EvaluationSection title="Report history"><EvaluationTable><thead><tr><th>Report</th><th>Evaluation</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td className="font-mono text-xs">{report.id}</td><td>{report.runId}</td><td><EvaluationLayerStatusBadge status={report.status} /></td><td>{new Date(report.createdAt).toLocaleString()}</td><td><Button asChild size="sm" variant="ghost"><Link to="/$projectId/evaluation/reports/$reportId" params={{ projectId, reportId: report.id }}>Open</Link></Button></td></tr>)}</tbody></EvaluationTable></EvaluationSection>
      <TargetEditor open={editorOpen} onOpenChange={setEditorOpen} targetId={target.id} />
    </div>
  );
}
