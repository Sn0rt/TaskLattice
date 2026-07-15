import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewBadge } from "@/components/shared/preview-badge";
import { MetricCard } from "@/components/shared/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/monitor/cost")({ component: Cost });

const costs = [
  ["deepseek-chat", "$10,820", "78%"],
  ["deepseek-reasoner", "$5,230", "42%"],
  ["embedding-v3", "$2,370", "19%"],
];

function Cost() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Cost"
        badge={<PreviewBadge />}
        description="Attribute API quota and Agent runtime cost by Model and workspace."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Month to date" value="$18,420" />
        <MetricCard label="Forecast" value="$27,900" />
        <MetricCard label="Budget used" value="61%" />
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="size-4" /> Cost by Model
          </CardTitle>
          <CardDescription>July 2026 preview allocation.</CardDescription>
        </CardHeader>
        <CardContent>
          {costs.map(([model, value, width]) => (
            <div
              key={model}
              className="grid min-h-14 grid-cols-[minmax(110px,0.8fr)_minmax(120px,2fr)_auto] items-center gap-4 border-b text-sm last:border-b-0"
            >
              <span className="truncate font-medium">{model}</span>
              <div className="h-2 bg-muted" aria-label={`${model} share ${width}`}>
                <div className="h-full bg-foreground" style={{ width }} />
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
