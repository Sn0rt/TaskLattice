import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Cpu, LockKeyhole, Network, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { UnavailableAction } from "@/components/shared/unavailable-action";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/agents/new")({ component: CreateAgent });
function CreateAgent() {
  const navigate = useNavigate();
  const [providerConnectionId, setProviderConnectionId] = useState("");
  const connections = useQuery({
    queryKey: ["provider-connections"],
    queryFn: api.listProviderConnections,
  });
  const validatedConnections = (connections.data ?? []).filter(
    (connection) => connection.status === "VALIDATED",
  );
  const mutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: (agent) =>
      void navigate({ to: "/agents/$agentId", params: { agentId: agent.id } }),
  });
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      runtime: "nemoclaw" as const,
      providerConnectionId: "",
      provider: "deepseek" as const,
      model: "deepseek-chat" as "deepseek-chat" | "deepseek-reasoner",
      systemPrompt:
        "You are a focused internal assistant. Complete the user's request inside the NemoClaw sandbox and explain the evidence clearly.",
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
  });
  const selectedConnection = validatedConnections.find(
    (connection) => connection.id === providerConnectionId,
  );

  useEffect(() => {
    const first = validatedConnections[0];
    if (!first || providerConnectionId) return;
    setProviderConnectionId(first.id);
    form.setFieldValue("providerConnectionId", first.id);
    form.setFieldValue("provider", first.provider);
    form.setFieldValue("model", first.model);
  }, [form, providerConnectionId, validatedConnections]);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Agent / Instance / Create"
        title="Create Instance"
        badge={<Badge variant="outline">UAT</Badge>}
        description="Define an Agent and provision its NemoClaw runtime Instance. Runtime creation continues asynchronously after submission."
      />
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="space-y-1">
          <div className="flex items-center gap-3 rounded-lg bg-primary px-3 py-3 text-sm text-primary-foreground">
            <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/15 text-xs">
              1
            </span>
            Agent configuration
          </div>
          <div className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-full border text-xs">
              2
            </span>
            Runtime & model
          </div>
          <div className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-full border text-xs">
              3
            </span>
            Create & observe
          </div>
          <Separator className="my-4" />
          <div className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="mb-2 size-4" />
            Credentials remain attached to the selected validated Provider.
            This form receives only its public identifier.
          </div>
        </aside>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-5"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-5" />
                Identity
              </CardTitle>
              <CardDescription>
                Name the desired Agent resource. TaskLattice derives a safe sandbox
                name.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length < 3
                      ? "Use at least 3 characters."
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Agent name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="research-assistant"
                    />
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors.join(" ")}
                    </p>
                  </div>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Summarizes internal research with citations"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="systemPrompt">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>System instructions</Label>
                    <Textarea
                      id={field.name}
                      className="min-h-32"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <div className="text-right text-xs text-muted-foreground">
                      {field.state.value.length} / 8000
                    </div>
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="size-5" />
                Runtime & model
              </CardTitle>
              <CardDescription>
                The core flow deliberately exposes only validated choices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Agent runtime</Label>
                  <Select value="nemoclaw">
                    <SelectTrigger>
                      <span className="flex items-center gap-2">
                        <img src="/assets/brands/nvidia-logo-square.png" alt="" className="size-5 object-contain" />
                        NemoClaw
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nemoclaw">
                        <span className="flex items-center gap-2">
                          <img src="/assets/brands/nvidia-logo-square.png" alt="" className="size-5 object-contain" />
                          <span><strong className="block text-xs">NemoClaw</strong><span className="text-[11px] text-muted-foreground">OpenClaw in OpenShell</span></span>
                        </span>
                      </SelectItem>
                      <SelectItem value="hermes" disabled>
                        <span className="flex items-center gap-2 opacity-55">
                          <img src="/assets/brands/hermes-agent-logo.png" alt="" className="size-5 rounded-sm object-contain grayscale" />
                          <span><strong className="block text-xs">Hermes Agent</strong><span className="text-[11px] text-muted-foreground">Coming later</span></span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Provider connection</Label>
                  <Select
                    value={providerConnectionId}
                    disabled={!validatedConnections.length}
                    onValueChange={(value) => {
                      const connection = validatedConnections.find(
                        (item) => item.id === value,
                      );
                      if (!connection) return;
                      setProviderConnectionId(value);
                      form.setFieldValue("providerConnectionId", value);
                      form.setFieldValue("provider", connection.provider);
                      form.setFieldValue("model", connection.model);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a validated Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {validatedConnections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          {connection.name} · {connection.endpoint} · {connection.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedConnection ? (
                <div className="grid gap-3 border-y py-3 text-xs sm:grid-cols-3">
                  <div><span className="text-muted-foreground">Endpoint</span><strong className="mt-1 block truncate font-mono">{selectedConnection.endpoint}</strong></div>
                  <div><span className="text-muted-foreground">Model</span><strong className="mt-1 block">{selectedConnection.model}</strong></div>
                  <div><span className="text-muted-foreground">Credential</span><strong className="mt-1 block">Stored by platform</strong></div>
                </div>
              ) : (
                <p role="alert" className="border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-xs">
                  No validated Provider is available. <Link to="/providers" className="font-semibold underline underline-offset-4">Register and validate a connection first.</Link>
                </p>
              )}
            </CardContent>
          </Card>
          {mutation.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {mutation.error.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <form.Subscribe
              selector={(state) => [
                state.values.name,
                state.values.systemPrompt,
                state.values.providerConnectionId,
                state.canSubmit,
                state.isSubmitting,
              ]}
            >
              {([name, systemPrompt, selectedProviderConnectionId, canSubmit, isSubmitting]) => (
                <Button
                  size="lg"
                  type="submit"
                  disabled={
                    String(name).trim().length < 3 ||
                    String(systemPrompt).trim().length < 10 ||
                    !String(selectedProviderConnectionId) ||
                    !canSubmit ||
                    Boolean(isSubmitting) ||
                    mutation.isPending
                  }
                >
                  {mutation.isPending
                    ? "Creating NemoClaw sandbox…"
                    : "Create Instance"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
        <aside>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">What TaskLattice will do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Network className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <strong>Call the OpenShell control plane</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Send a typed provisioning request, never a shell string.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <strong>Bind the validated Provider</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Resolve the selected Pi-validated Provider connection without exposing its credential.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <strong>Create the sandbox</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Observe provisioning until NemoClaw reports Ready.
                  </p>
                </div>
              </div>
              <Separator />
              <UnavailableAction label="Attach Skills" />
              <UnavailableAction label="Hermes Agent runtime" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
