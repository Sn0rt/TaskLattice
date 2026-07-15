import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PreviewBadge } from "@/components/shared/preview-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auditPreviews } from "@/lib/preview-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/monitor/audit")({ component: Audit });

function Audit() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const selected = auditPreviews[selectedIndex] ?? auditPreviews[0]!;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Audit"
        badge={<PreviewBadge />}
        description="Trace changes across Quota, Instance, Skill, Ticket, and Sandbox resources."
        actions={
          <Button variant="outline" className="h-11" disabled>
            <Download /> Export
          </Button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4" /> Activity
            </CardTitle>
            <CardDescription>Recent structured platform events.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="hidden grid-cols-[0.6fr_1fr_1fr_auto] gap-3 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
              <span>Time</span>
              <span>Action</span>
              <span>Resource</span>
              <span>Result</span>
            </div>
            {auditPreviews.map((event, index) => (
              <button
                key={`${event.time}-${event.resource}`}
                type="button"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/45 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[0.6fr_1fr_1fr_auto]",
                  selectedIndex === index &&
                    "bg-muted/70 shadow-[inset_3px_0_0_var(--foreground)]",
                )}
              >
                <span className="text-xs text-muted-foreground">{event.time}</span>
                <strong className="hidden font-medium sm:block">{event.action}</strong>
                <span className="hidden truncate sm:block">{event.resource}</span>
                <StatusDot
                  label={event.result}
                  tone={event.result === "SUCCESS" ? "success" : "danger"}
                />
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b">
            <StatusDot
              label={selected.result}
              tone={selected.result === "SUCCESS" ? "success" : "danger"}
            />
            <CardTitle className="mt-3">{selected.action}</CardTitle>
            <CardDescription>{selected.time} · UAT</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="text-xs">
              {[
                ["Resource", selected.resource],
                ["Actor", selected.actor],
                ["Environment", "UAT"],
                ["Related ticket", "REQ-2026-0715"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex min-h-10 items-center justify-between gap-3 border-b last:border-b-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="max-w-[65%] break-all text-right font-medium">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
