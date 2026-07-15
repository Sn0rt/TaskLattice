import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bot, Box, Container, Cpu, ScrollText, type LucideIcon } from "lucide-react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { ProvisioningLog } from "@/components/agents/provisioning-log";
import { AgentTerminal } from "@/components/terminal";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/shared/detail-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export const Route = createFileRoute("/agents/$agentId")({
  component: AgentDetail,
});

function AgentDetail() {
  const { agentId } = Route.useParams();
  const agent = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => api.getAgent(agentId),
    refetchInterval: (query) =>
      query.state.data?.status === "READY" ||
      query.state.data?.status === "FAILED"
        ? false
        : 1_000,
  });
  const runtime = useQuery({
    queryKey: ["runtime-status"],
    queryFn: api.getRuntimeStatus,
    retry: 1,
    staleTime: 5_000,
  });

  if (!agent.data)
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading Agent…
      </div>
    );

  const progress =
    agent.data.status === "READY" || agent.data.status === "FAILED" ? 100 : 56;
  const hierarchy: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Bot, label: "Agent", value: "Desired identity" },
    { icon: Cpu, label: "Instance", value: agent.data.id.slice(0, 8) },
    { icon: Box, label: "OpenShell Sandbox", value: agent.data.sandboxName },
    { icon: Container, label: "Pod", value: "Ephemeral realization" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Agent / Instances / ${agent.data.id.slice(0, 8)}`}
        title={agent.data.name}
        description={agent.data.description || "NemoClaw runtime Instance"}
        badge={<AgentStatusBadge status={agent.data.status} />}
      />
      <div className="grid items-stretch border-y text-xs sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
        {hierarchy.map(({ icon: Icon, label, value }, index) => (
          <div key={label} className="contents">
            <div className="min-w-0 px-3 py-3">
              <div className="flex items-center gap-2 font-medium">
                <Icon className="size-3.5" />
                {label}
              </div>
              <div className="mt-1 truncate font-mono text-muted-foreground">
                {value}
              </div>
            </div>
            {index < 3 ? (
              <ArrowRight className="mx-1 hidden size-3.5 text-muted-foreground sm:block" />
            ) : null}
          </div>
        ))}
      </div>
      {agent.data.status !== "READY" ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="size-4" />
              Provisioning
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>Logs remain visible while the Instance is being created or needs recovery.</span>
              <Link to="/sandboxes" className="font-medium text-foreground underline underline-offset-4">Open Sandbox audit</Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span>Sandbox provisioning</span>
              <span className="text-muted-foreground">
                {agent.data.runtimePhase ?? "PROVISIONING"}
              </span>
            </div>
            <Progress value={progress} />
            {agent.data.error ? (
              <p className="mt-3 flex gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                {agent.data.error}
              </p>
            ) : null}
            <ProvisioningLog lines={agent.data.logs} />
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <DetailCard icon={Box} label="Runtime" value="NemoClaw / OpenClaw" />
        <DetailCard
          icon={Cpu}
          label="Provider"
          value={`DeepSeek · ${agent.data.model}`}
        />
        <DetailCard
          label="OpenShell Sandbox"
          value={agent.data.sandboxName}
          mono
        />
      </div>
      <Card id="terminal" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Container className="size-4" />
            NemoClaw TUI
          </CardTitle>
          <CardDescription>
            Interactive OpenClaw client attached to this Agent&apos;s in-sandbox
            Gateway through OpenShell. This surface never falls back to the
            runner host shell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentTerminal
            agentId={agentId}
            enabled={agent.data.status === "READY"}
            runtimeStatus={runtime.data}
            runtimeError={
              runtime.error instanceof Error ? runtime.error.message : undefined
            }
            runtimeChecking={runtime.isFetching}
            onRecheckRuntime={() => void runtime.refetch()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
