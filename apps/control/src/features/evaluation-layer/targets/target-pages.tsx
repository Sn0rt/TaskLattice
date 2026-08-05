import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Plus, Target as TargetIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentProjectId } from '@/hooks/use-project';
import { cn } from '@/lib/utils';
import { AgentGardenIcon } from '@/components/agent-garden/agent-garden-icon';
import type { EvaluationLayerResource, EvaluationLayerTool } from '../model';
import { useEvaluationLayerState, useEvaluationLayerStore } from '../mock-provider';
import { EvaluationLayerStatusBadge } from '../shared/evaluation-status';
import {
  EvaluationMetric,
  EvaluationSection,
  EvaluationTable,
  KeyValueGrid,
  formatCost,
  formatRelativeTime,
} from '../shared/evaluation-ui';
import { traceCost } from '../traces/trace-view-model';

const LIVE_STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  ONLINE: { dot: 'bg-emerald-500', label: 'Online' },
  DEGRADED: { dot: 'bg-amber-500', label: 'Degraded' },
  OFFLINE: { dot: 'bg-muted-foreground/50', label: 'Offline' },
};

function LiveStatusBadge({ status }: { status: string }) {
  const style = LIVE_STATUS_STYLE[status] ?? LIVE_STATUS_STYLE.OFFLINE!;
  return (
    <span className='flex items-center gap-2 text-xs'>
      <span className='relative flex size-2'>
        <span className={cn('relative inline-flex size-2 rounded-full', style.dot)} />
      </span>
      {style.label}
    </span>
  );
}

const targetFilters = ['All targets', 'Model only', 'With Prompt', 'With Tools', 'With MCP', 'With KB'] as const;
const mcpCatalog: EvaluationLayerResource[] = [
  { id: 'langfuse-mcp', name: 'Langfuse MCP' },
  { id: 'operations-mcp', name: 'Operations MCP' },
];
const kbCatalog: EvaluationLayerResource[] = [
  { id: 'policy-kb', name: 'Permission Policy KB' },
  { id: 'runbook-kb', name: 'Operations Runbook KB' },
];

function rate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function reportMetrics(state: ReturnType<typeof useEvaluationLayerState>, reportId: string) {
  const report = state.reports.find((item) => item.id === reportId);
  const run = report ? state.runs.find((item) => item.id === report.runId) : undefined;
  const done = run?.results.filter((item) => item.status !== 'PENDING') ?? [];
  const traceIds = new Set(done.map((item) => item.traceId).filter(Boolean));
  return {
    report,
    run,
    passRate: done.length ? done.filter((item) => item.status === 'PASS').length / done.length : 0,
    cost: state.traces.filter((item) => traceIds.has(item.id)).reduce((sum, item) => sum + traceCost(item), 0),
  };
}

function targetReports(state: ReturnType<typeof useEvaluationLayerState>, targetId: string) {
  return state.reports
    .filter((report) => state.runs.find((run) => run.id === report.runId)?.targetId === targetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function configurationSummary(revision: ReturnType<typeof useEvaluationLayerState>['targetRevisions'][number]) {
  const parts = ['Model'];
  if (revision.prompt?.trim()) parts.push('Prompt');
  if (revision.tools.length) parts.push(`${revision.tools.length} Tools`);
  if (revision.mcpServers?.length) parts.push(`${revision.mcpServers.length} MCP`);
  if (revision.knowledgeBases?.length) parts.push(`${revision.knowledgeBases.length} KB`);
  return parts.length === 1 ? 'Model only' : parts.join(' · ');
}

function resourcePicker({
  title,
  items,
  selected,
  onChange,
}: {
  title: string;
  items: EvaluationLayerResource[];
  selected: string[];
  onChange(value: string[]): void;
}) {
  return (
    <fieldset className='space-y-2 rounded-lg border p-3'>
      <legend className='px-1 text-sm font-medium'>{title}</legend>
      {items.map((item) => (
        <label key={item.id} className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={selected.includes(item.id)}
            onChange={(event) =>
              onChange(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))
            }
          />
          {item.name}
        </label>
      ))}
      {!items.length ? <p className='text-xs text-muted-foreground'>No resources available.</p> : null}
    </fieldset>
  );
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
  const toolCatalog = useMemo(() => {
    const tools = new Map<string, EvaluationLayerTool>();
    state.targetRevisions.flatMap((item) => item.tools).forEach((tool) => tools.set(tool.id, tool));
    return [...tools.values()];
  }, [state.targetRevisions]);
  const [name, setName] = useState(target?.name ?? '');
  const [description, setDescription] = useState(target?.description ?? '');
  const [model, setModel] = useState(revision?.model ?? 'gpt-5-mini');
  const [prompt, setPrompt] = useState(revision?.prompt ?? '');
  const [toolIds, setToolIds] = useState(revision?.tools.map((item) => item.id) ?? []);
  const [mcpIds, setMcpIds] = useState(revision?.mcpServers?.map((item) => item.id) ?? []);
  const [kbIds, setKbIds] = useState(revision?.knowledgeBases?.map((item) => item.id) ?? []);
  const [error, setError] = useState('');
  const selectedTools = toolCatalog.filter((item) => toolIds.includes(item.id));
  const selectedMcp = mcpCatalog.filter((item) => mcpIds.includes(item.id));
  const selectedKb = kbCatalog.filter((item) => kbIds.includes(item.id));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = {
      model,
      prompt,
      tools: selectedTools,
      mcpServers: selectedMcp,
      knowledgeBases: selectedKb,
    };
    if (targetId) {
      const result = store.createTargetRevision(targetId, input);
      if (!result.ok) return setError(result.error);
    } else {
      const result = store.createTarget({ name, description, ...input });
      if (!result.ok) return setError(result.error);
      store.selectActiveTarget(result.value.targetId);
    }
    setError('');
    onOpenChange(false);
  };

  const scope = ['Model', ...(prompt.trim() ? ['Prompt'] : []), ...(toolIds.length ? ['Tool use'] : []), ...(mcpIds.length ? ['MCP access'] : []), ...(kbIds.length ? ['Knowledge grounding'] : [])];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[min(calc(100%-2rem),58rem)]'>
        <DialogHeader>
          <DialogTitle>{targetId ? 'Create target revision' : 'Create target'}</DialogTitle>
          <DialogDescription>Define the immutable subject used by evaluations.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className='grid max-h-[68vh] gap-5 overflow-y-auto px-6 py-5'>
            {!targetId ? (
              <div className='grid gap-4 md:grid-cols-2'>
                <Label className='grid gap-2'>Name *<Input value={name} onChange={(event) => setName(event.target.value)} /></Label>
                <Label className='grid gap-2'>Description<Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Label>
              </div>
            ) : null}
            <div className='grid gap-4 md:grid-cols-2'>
              <Label className='grid gap-2'>Model *<Input value={model} onChange={(event) => setModel(event.target.value)} /></Label>
              <Label className='grid gap-2'>System prompt (optional)<Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></Label>
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              {resourcePicker({ title: 'Tools', items: toolCatalog, selected: toolIds, onChange: setToolIds })}
              {resourcePicker({ title: 'MCP servers', items: mcpCatalog, selected: mcpIds, onChange: setMcpIds })}
              {resourcePicker({ title: 'Knowledge bases', items: kbCatalog, selected: kbIds, onChange: setKbIds })}
            </div>
            <div className='rounded-lg border bg-muted/25 p-4'>
              <p className='text-xs text-muted-foreground'>Revision preview</p>
              <p className='mt-1 font-medium'>{name.trim() || target?.name || 'Untitled target'}</p>
              <p className='mt-1 text-sm'>{scope.join(' · ')}</p>
              <p className='mt-1 text-xs text-muted-foreground'>{toolIds.length} Tools · {mcpIds.length} MCP · {kbIds.length} KB</p>
            </div>
            <p className='text-xs text-muted-foreground'>Authentication is not stored in Target. Supply resource authorization through the Dataset header field.</p>
            {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type='submit'>{targetId ? 'Create target revision' : 'Create target revision'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EvaluationTargetList() {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof targetFilters)[number]>('All targets');
  const rows = state.targets.filter((target) => {
    const revision = state.targetRevisions.find((item) => item.id === target.currentRevisionId)!;
    if (filter === 'Model only') return !revision.prompt?.trim() && !revision.tools.length && !revision.mcpServers?.length && !revision.knowledgeBases?.length;
    if (filter === 'With Prompt') return Boolean(revision.prompt?.trim());
    if (filter === 'With Tools') return Boolean(revision.tools.length);
    if (filter === 'With MCP') return Boolean(revision.mcpServers?.length);
    if (filter === 'With KB') return Boolean(revision.knowledgeBases?.length);
    return true;
  });
  // Live-monitoring demo: most recently active Agents float to the top.
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
    [rows],
  );
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <Label className='grid gap-2 text-xs text-muted-foreground'>
          Target filter
          <select className='h-9 min-w-48 rounded-md border bg-background px-3 text-sm text-foreground' value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            {targetFilters.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Label>
        <div className='flex items-center gap-4'>
          <span className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400'>
            <span className='relative flex size-2'>
              <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
            </span>
            Live monitoring
          </span>
          <Button onClick={() => setEditorOpen(true)}><Plus className='size-4' />Create</Button>
        </div>
      </div>
      {sortedRows.length ? (
        <EvaluationTable>
          <thead><tr><th>Target</th><th>Live</th><th>Last activity</th><th>Revision</th><th>Configuration</th><th>Updated</th><th>View</th></tr></thead>
          <tbody>
            {sortedRows.map((target) => {
              const revision = state.targetRevisions.find((item) => item.id === target.currentRevisionId)!;
              return (
                <tr key={target.id}>
                  <td>
                    <div className='flex items-center gap-3'>
                      <AgentGardenIcon type='custom' catalogIcon={target.icon} className='size-9' iconClassName='size-4' />
                      <span className='font-medium'>{target.name}</span>
                    </div>
                  </td>
                  <td><LiveStatusBadge status={target.liveStatus} /></td>
                  <td className='whitespace-nowrap text-xs text-muted-foreground'>{formatRelativeTime(target.lastActivityAt)}</td>
                  <td>R{revision.revision}</td>
                  <td>{configurationSummary(revision)}</td>
                  <td>{new Date(revision.createdAt).toLocaleString()}</td>
                  <td><Button asChild size='sm' variant='outline'><Link onClick={() => store.selectActiveTarget(target.id)} to='/$projectId/evaluation/targets/$targetId' params={{ projectId, targetId: target.id }}>View<ArrowRight className='size-4' /></Link></Button></td>
                </tr>
              );
            })}
          </tbody>
        </EvaluationTable>
      ) : <p className='rounded-lg border p-6 text-sm text-muted-foreground'>No Targets match this filter.</p>}
      <TargetEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  );
}

export function EvaluationTargetDetail({ targetId }: { targetId: string }) {
  const state = useEvaluationLayerState();
  const store = useEvaluationLayerStore();
  const projectId = useCurrentProjectId();
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const target = state.targets.find((item) => item.id === targetId);
  const revisions = useMemo(() => state.targetRevisions.filter((item) => item.targetId === targetId).sort((a, b) => b.revision - a.revision), [state.targetRevisions, targetId]);
  if (!target) return <EmptyState icon={TargetIcon} title='Target not found' description='This Target does not exist in the Evaluation demo.' action={<Button asChild variant='outline'><Link to='/$projectId/evaluation/targets' params={{ projectId }}>Back to Target</Link></Button>} />;
  const current = revisions.find((item) => item.id === target.currentRevisionId)!;
  const reports = targetReports(state, target.id);
  const reportRows = reports.map((report, index) => {
    const metrics = reportMetrics(state, report.id);
    const targetRevision = state.targetRevisions.find((item) => item.id === metrics.run?.targetRevisionId);
    const datasetRevision = state.datasetRevisions.find((item) => item.id === metrics.run?.datasetRevisionId);
    const previous = reports[index + 1] ? reportMetrics(state, reports[index + 1]!.id).passRate : undefined;
    return { report, metrics, targetRevision, datasetRevision, delta: previous === undefined ? undefined : metrics.passRate - previous };
  });
  const latest = reportRows[0];
  const delegatedAgents = current.tools.filter((tool) => tool.connectionType === 'agent');
  const directTools = current.tools.filter((tool) => tool.connectionType !== 'agent');
  const mcpServers = current.mcpServers ?? [];
  const knowledgeBases = current.knowledgeBases ?? [];
  const renderToolTable = (tools: EvaluationLayerTool[]) => (
    <EvaluationTable><thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Tags</th></tr></thead><tbody>{tools.map((tool) => <tr key={tool.id}><td className='font-medium'>{tool.name}</td><td>{tool.description}</td><td>{tool.enabled ? 'Enabled' : 'Disabled'}</td><td>{tool.tags.join(', ')}</td></tr>)}</tbody></EvaluationTable>
  );
  const renderResourceTable = (resources: EvaluationLayerResource[]) => (
    <EvaluationTable><thead><tr><th>Name</th><th>ID</th></tr></thead><tbody>{resources.map((resource) => <tr key={resource.id}><td className='font-medium'>{resource.name}</td><td className='font-mono text-xs'>{resource.id}</td></tr>)}</tbody></EvaluationTable>
  );
  const emptyText = (label: string) => <p className='rounded-lg border p-6 text-sm text-muted-foreground'>No {label} configured for this revision.</p>;
  const evaluate = () => {
    store.selectActiveTarget(target.id);
    void navigate({ to: '/$projectId/evaluation/runs/new', params: { projectId } });
  };
  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-start gap-4'>
          <AgentGardenIcon type='custom' catalogIcon={target.icon} />
          <div><h2 className='text-2xl font-semibold'>{target.name}</h2><p className='mt-1 text-sm text-muted-foreground'>{target.description || 'No description recorded.'}</p><p className='mt-1 text-xs text-muted-foreground'>Revision {current.revision} · {configurationSummary(current)}</p></div>
        </div>
        <div className='flex gap-2'><Button variant='outline' onClick={() => setEditorOpen(true)}><Plus className='size-4' />New revision</Button><Button onClick={evaluate}>Evaluate</Button></div>
      </div>
      <EvaluationSection title='Configuration'>
        <KeyValueGrid className='lg:grid-cols-3' items={[
          ['Model', current.model],
          ['Revision', `R${current.revision}`],
          ['Prompt', current.prompt?.trim() ? 'Configured' : 'None'],
        ]} />
        <Tabs defaultValue='agents' className='mt-4'>
          <TabsList>
            <TabsTrigger value='agents'>Agents ({delegatedAgents.length})</TabsTrigger>
            <TabsTrigger value='tools'>Tools ({directTools.length})</TabsTrigger>
            <TabsTrigger value='mcp'>MCP ({mcpServers.length})</TabsTrigger>
            <TabsTrigger value='kb'>KB ({knowledgeBases.length})</TabsTrigger>
          </TabsList>
          <TabsContent value='agents'>{delegatedAgents.length ? renderToolTable(delegatedAgents) : emptyText('delegated Agents')}</TabsContent>
          <TabsContent value='tools'>{directTools.length ? renderToolTable(directTools) : emptyText('Tools')}</TabsContent>
          <TabsContent value='mcp'>{mcpServers.length ? renderResourceTable(mcpServers) : emptyText('MCP servers')}</TabsContent>
          <TabsContent value='kb'>{knowledgeBases.length ? renderResourceTable(knowledgeBases) : emptyText('Knowledge bases')}</TabsContent>
        </Tabs>
      </EvaluationSection>
      <EvaluationSection title='Latest Report'>
        {latest ? (
          <div className='grid gap-4 md:grid-cols-4'>
            <KeyValueGrid className='md:col-span-4 lg:grid-cols-4' items={[
              ['Status', <EvaluationLayerStatusBadge status={latest.report.status} />],
              ['Pass rate', rate(latest.metrics.passRate)],
              ['Evaluation cost', formatCost(latest.metrics.cost)],
              ['Created', new Date(latest.report.createdAt).toLocaleString()],
            ]} />
            <Button asChild className='md:col-start-4'><Link to='/$projectId/evaluation/reports/$reportId' params={{ projectId, reportId: latest.report.id }}>View report</Link></Button>
          </div>
        ) : <p className='text-sm text-muted-foreground'>No immutable Reports have been created for this Target yet.</p>}
      </EvaluationSection>
      <div className='grid gap-4 md:grid-cols-2'>
        <EvaluationSection title='Quality trend'>{reportRows.length < 2 ? <p className='text-sm text-muted-foreground'>At least two Reports are required to show a quality trend.</p> : <div className='space-y-3'>{reportRows.map((row) => <div key={row.report.id}><div className='flex justify-between text-xs'><span>{new Date(row.report.createdAt).toLocaleDateString()}</span><span>{rate(row.metrics.passRate)}</span></div><div className='mt-1 h-2 rounded bg-muted'><div className='h-2 rounded bg-emerald-500' style={{ width: rate(row.metrics.passRate) }} /></div></div>)}</div>}</EvaluationSection>
        <EvaluationSection title='Cost trend'>{reportRows.length < 2 ? <p className='text-sm text-muted-foreground'>At least two Reports with evaluation cost are required to show a cost trend.</p> : <div className='grid gap-3 sm:grid-cols-2'>{reportRows.map((row) => <EvaluationMetric key={row.report.id} label={new Date(row.report.createdAt).toLocaleDateString()} value={formatCost(row.metrics.cost)} />)}</div>}</EvaluationSection>
      </div>
      <EvaluationSection title='Report history'>
        {reportRows.length ? <EvaluationTable><thead><tr><th>Report ID</th><th>Time</th><th>Target revision</th><th>Dataset revision</th><th>Status</th><th>Pass rate</th><th>Pass rate delta</th><th>Cost</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.report.id}><td><Button asChild size='sm' variant='outline'><Link className='font-mono text-xs' to='/$projectId/evaluation/reports/$reportId' params={{ projectId, reportId: row.report.id }}>{row.report.id}</Link></Button></td><td>{new Date(row.report.createdAt).toLocaleString()}</td><td>{row.targetRevision ? `R${row.targetRevision.revision}` : '—'}</td><td>{row.datasetRevision ? `R${row.datasetRevision.revision}` : '—'}</td><td>{row.report.status}</td><td>{rate(row.metrics.passRate)}</td><td>{row.delta === undefined ? '—' : `${row.delta >= 0 ? '+' : ''}${(row.delta * 100).toFixed(1)} pp`}</td><td>{formatCost(row.metrics.cost)}</td></tr>)}</tbody></EvaluationTable> : <p className='text-sm text-muted-foreground'>No Reports yet.</p>}
      </EvaluationSection>
      <TargetEditor open={editorOpen} onOpenChange={setEditorOpen} targetId={target.id} />
    </div>
  );
}
