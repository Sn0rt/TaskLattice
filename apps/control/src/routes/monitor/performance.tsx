import { createFileRoute } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewBadge } from "@/components/shared/preview-badge";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusDot } from "@/components/shared/status-dot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/monitor/performance")({
  component: Performance,
});

const endpoints = [
  ["deepseek-chat", "api.deepseek.internal", "1.12s", "99.91%", "HEALTHY"],
  ["deepseek-reasoner", "api.deepseek.internal", "2.84s", "98.74%", "DEGRADED"],
  ["embedding-v3", "embedding.platform.internal", "420ms", "99.99%", "HEALTHY"],
] as const;

function Performance() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Performance"
        badge={<PreviewBadge />}
        description="Monitor Endpoint latency, success rate, throughput, and Instance health."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="P95 latency" value="1.28s" />
        <MetricCard label="Success rate" value="99.82%" />
        <MetricCard label="Ready instances" value="18 / 20" />
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="size-4" /> Endpoint performance
          </CardTitle>
          <CardDescription>Last 24 hours.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_0.7fr_0.7fr_auto] gap-3 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
            <span>Endpoint / Model</span>
            <span>P95</span>
            <span>Success</span>
            <span>State</span>
          </div>
          {endpoints.map(([model, endpoint, latency, success, state]) => (
            <div
              key={model}
              className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_0.7fr_0.7fr_auto]"
            >
              <span className="min-w-0">
                <strong className="block truncate font-medium">{model}</strong>
                <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                  {endpoint}
                </span>
              </span>
              <span className="hidden sm:block">{latency}</span>
              <span className="hidden sm:block">{success}</span>
              <StatusDot
                label={state}
                tone={state === "HEALTHY" ? "success" : "warning"}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
