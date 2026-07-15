import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleGauge,
  DatabaseZap,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react";
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
import { quotaPreviews } from "@/lib/preview-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/api-quota")({ component: ApiQuota });

function ApiQuota() {
  const defaultQuota = quotaPreviews[0]!;
  const [selectedId, setSelectedId] = useState(defaultQuota.id);
  const [validation, setValidation] = useState<"idle" | "running" | "passed">(
    "idle",
  );
  const selected =
    quotaPreviews.find((quota) => quota.id === selectedId) ?? defaultQuota;

  const validate = () => {
    setValidation("running");
    window.setTimeout(() => setValidation("passed"), 650);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="API Quota"
        title="Model quotas"
        badge={<PreviewBadge />}
        description="Register an Endpoint and Model, define quota dimensions, then validate the complete route before activation."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-11" disabled>
              <Server /> Add Endpoint
            </Button>
            <Button variant="outline" className="h-11" disabled>
              <DatabaseZap /> Add Model
            </Button>
            <Button className="h-11" disabled>
              <Plus /> Create Quota
            </Button>
          </div>
        }
      />

      <ol className="grid border-y text-xs text-muted-foreground sm:grid-cols-5">
        {[
          ["01", "Endpoint", "Connection + auth"],
          ["02", "Model", "Runtime identity"],
          ["03", "Limits", "RPM · TPM · budget"],
          ["04", "Validate", "Live checks"],
          ["05", "Activate", "Quota available"],
        ].map(([step, label, detail], index) => (
          <li
            key={step}
            className={cn(
              "min-h-20 border-b p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0",
              index === 3 && "bg-muted/50 text-foreground",
            )}
          >
            <span className="font-mono">{step}</span>
            <strong className="mt-1 block text-sm font-medium">{label}</strong>
            <span className="mt-1 block">{detail}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Quota list</CardTitle>
            <CardDescription>
              Select a model quota before running actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_0.6fr_auto] gap-3 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
              <span>Endpoint / Model</span>
              <span>Limit</span>
              <span>Usage</span>
              <span>Status</span>
            </div>
            {quotaPreviews.map((quota) => (
              <button
                key={quota.id}
                type="button"
                aria-pressed={selected.id === quota.id}
                onClick={() => {
                  setSelectedId(quota.id);
                  setValidation("idle");
                }}
                className={cn(
                  "grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/45 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1.5fr)_1fr_0.6fr_auto]",
                  selected.id === quota.id &&
                    "bg-muted/70 shadow-[inset_3px_0_0_var(--foreground)]",
                )}
              >
                <span className="min-w-0">
                  <strong className="block truncate font-medium">
                    {quota.model}
                  </strong>
                  <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                    {quota.endpoint}
                  </span>
                </span>
                <span className="hidden text-xs sm:block">{quota.limit}</span>
                <span className="hidden text-xs sm:block">{quota.usage}</span>
                <StatusDot
                  label={quota.status}
                  tone={quota.status === "ACTIVE" ? "success" : "neutral"}
                />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-24">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <StatusDot
                label={selected.status}
                tone={selected.status === "ACTIVE" ? "success" : "neutral"}
              />
              <span className="text-xs text-muted-foreground">Selected item</span>
            </div>
            <CardTitle className="mt-3">{selected.model}</CardTitle>
            <CardDescription className="break-all font-mono text-xs">
              {selected.endpoint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              {[
                "Endpoint reachability",
                "Model discovery",
                "Credential scope",
                "Quota dimensions",
              ].map((label) => (
                <div
                  key={label}
                  className="flex min-h-10 items-center justify-between gap-3 border-b text-xs last:border-b-0"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="flex items-center gap-1 font-medium">
                    {validation === "passed" ? (
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    ) : validation === "running" ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : null}
                    {validation === "passed"
                      ? "Pass"
                      : validation === "running"
                        ? "Checking"
                        : "Not run"}
                  </span>
                </div>
              ))}
            </div>
            {validation === "passed" ? (
              <p role="status" className="border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-2 text-xs">
                Validation preview completed. The Endpoint, Model, and quota
                dimensions are internally consistent.
              </p>
            ) : null}
            <p className="text-xs leading-5 text-muted-foreground">
              Endpoint, Model, and quota CRUD are UI-only until their control
              APIs are implemented.
            </p>
            <div className="grid gap-2">
              <Button
                onClick={validate}
                disabled={validation === "running"}
                className="h-11"
              >
                {validation === "running" ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <CircleGauge />
                )}
                {validation === "running" ? "Validating…" : "Validate Quota"}
              </Button>
              <Button variant="outline" className="h-11">
                Edit selected
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
