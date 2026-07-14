import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Plus, ServerCog } from "lucide-react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({ component: Overview });

function Overview() {
  const agents = useQuery({ queryKey: ["agents"], queryFn: api.listAgents });
  const ready = agents.data?.filter((agent) => agent.status === "READY").length ?? 0;
  const primaryAgent = agents.data?.[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace / UAT"
        title="Agent workspace"
        description="Create and operate isolated NemoClaw agents through one auditable control path."
        actions={
          <Button asChild size="lg">
            <Link to="/agents/new"><Plus />Create Agent</Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Agent instances" value={agents.data?.length ?? 0} />
        <MetricCard label="Ready sandboxes" value={ready} />
        <MetricCard disabled label="Loaded Skills · Later" value="—" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ServerCog className="size-5" />Core path</CardTitle>
          <CardDescription>One runtime and one provider family keep the first operating loop inspectable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          {[["Runtime", "NVIDIA NemoClaw"], ["Provider", "DeepSeek via AI SDK"], ["Interaction", "REST + WebSocket terminal"]].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-muted/35 p-4">
              <span className="text-muted-foreground">{label}</span>
              <strong className="mt-2 block">{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
      {primaryAgent ? (
        <Card className="border-primary/20 bg-primary/[0.025]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardDescription className="flex items-center gap-2"><Bot className="size-4" />Active Agent resource</CardDescription>
              <CardTitle className="mt-2">{primaryAgent.name}</CardTitle>
            </div>
            <AgentStatusBadge status={primaryAgent.status} />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div><div className="text-xs text-muted-foreground">Desired Agent</div><div className="mt-1 font-medium">NemoClaw · {primaryAgent.model}</div></div>
            <div><div className="text-xs text-muted-foreground">Runtime sandbox</div><div className="mt-1 font-mono text-sm">{primaryAgent.sandboxName}</div></div>
            <Button variant="outline" asChild><Link to="/agents/$agentId" params={{ agentId: primaryAgent.id }}>Open Agent</Link></Button>
          </CardContent>
        </Card>
      ) : null}
      {agents.data?.length === 0 ? <EmptyState icon={Bot} title="No Agent instances yet" description="Create the first NemoClaw sandbox to start the core flow." /> : null}
    </div>
  );
}
