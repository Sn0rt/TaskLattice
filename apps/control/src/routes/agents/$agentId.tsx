import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Box, Cpu, ScrollText } from "lucide-react";
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

  if (!agent.data)
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Loading Agent…
      </div>
    );

  const progress =
    agent.data.status === "READY" || agent.data.status === "FAILED" ? 100 : 56;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Agents / ${agent.data.id.slice(0, 8)}`}
        title={agent.data.name}
        description={agent.data.description || "NemoClaw Agent instance"}
        badge={<AgentStatusBadge status={agent.data.status} />}
      />
      {agent.data.status !== "READY" ? (
        <Card>
          <CardContent className="py-5">
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
          label="Sandbox"
          value={agent.data.sandboxName}
          mono
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4" />
            Provisioning evidence
          </CardTitle>
          <CardDescription>
            Sanitized Runtime Host output. Credentials are never included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProvisioningLog lines={agent.data.logs} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terminal</CardTitle>
          <CardDescription>
            Opens the DeepSeek-backed OpenClaw TUI inside the same Kubernetes
            Sandbox Pod. Exiting the TUI leaves you at the Sandbox shell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentTerminal
            agentId={agentId}
            enabled={agent.data.status === "READY"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
